'use client';

import React, { createContext, useContext, useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { Character, Message, ChatState } from '../types/chat';
import { parseReply } from '../utils/parseReply';
import { cleanTextForSpeech } from '../utils/cleanText';

interface User {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
}

interface ChatContextType {
  chatState: ChatState;
  user: User | null;
  selectCharacter: (character: Character) => void;
  sendMessage: (content: string, turnstileToken?: string | null) => void;
  resetChat: () => void;
  login: (userData: User) => void;
  logout: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const getUserId = (): string => {
  if (typeof window === 'undefined') {
    return `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    return user.id;
  }
  let userId = localStorage.getItem('paper_boyfriend_user_id');
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('paper_boyfriend_user_id', userId);
  }
  return userId;
};

const getUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [chatState, setChatState] = useState<ChatState>({
    character: null,
    messages: [],
    isTyping: false,
    isGeneratingImage: false,
  });
  const [user, setUser] = useState<User | null>(getUser());

  const isGeneratingRef = useRef(false);

  const login = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  const loadHistoryMessages = useCallback(async (characterId: string) => {
    try {
      const userId = getUserId();
      const response = await fetch('/api/chat/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, characterId }),
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) {
        const { messages } = await response.json();
        if (messages && messages.length > 0) {
          setChatState(prev => ({
            ...prev,
            messages: messages as Message[],
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, []);

  const saveMessages = useCallback(async (messages: Message[], character: Character) => {
    try {
      const userId = getUserId();
      await fetch('/api/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          characterId: character.id,
          characterName: character.name,
          messages,
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  }, []);

  const selectCharacter = useCallback(async (character: Character) => {
    setChatState({
      character,
      messages: [],
      isTyping: false,
      isGeneratingImage: false,
    });
    await loadHistoryMessages(character.id);
  }, [loadHistoryMessages]);

  const resetChat = useCallback(() => {
    setChatState({
      character: null,
      messages: [],
      isTyping: false,
      isGeneratingImage: false,
    });
  }, []);

  const sendMessage = useCallback(async (content: string, turnstileToken?: string | null) => {
    if (isGeneratingRef.current || !chatState.character) return;
    isGeneratingRef.current = true;

    try {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        type: 'text',
        content,
        timestamp: Date.now(),
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isTyping: true,
      }));

      const recentMessages = chatState.messages.slice(-20);
      const chatHistory = recentMessages.map(msg => ({
        role: msg.role === 'character' ? 'assistant' as const : 'user' as const,
        content: msg.content,
      }));

      const llmResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: chatState.character.id,
          systemPrompt: chatState.character.systemPrompt,
          messages: [...chatHistory, { role: 'user', content }],
          turnstileToken,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!llmResponse.ok) throw new Error('LLM request failed');

      const { reply } = await llmResponse.json();
      const { text, imagePrompt } = parseReply(reply);

      const characterTextMessage: Message = {
        id: `char-text-${Date.now()}`,
        role: 'character',
        type: 'text',
        content: text,
        timestamp: Date.now(),
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, characterTextMessage],
        isTyping: false,
        isGeneratingImage: !!imagePrompt,
      }));

      const cleanText = cleanTextForSpeech(text);
      if (cleanText) {
        fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanText,
            speaker: chatState.character.speaker,
            uid: `user-${Date.now()}`,
          }),
          signal: AbortSignal.timeout(15000),
        })
          .then(async ttsRes => {
            if (!ttsRes.ok) throw new Error('TTS request failed');
            const { audioUri } = await ttsRes.json();
            if (audioUri) {
              setChatState(prev => ({
                ...prev,
                messages: prev.messages.map(msg =>
                  msg.id === characterTextMessage.id
                    ? { ...msg, audioUri }
                    : msg
                ),
              }));
            }
          })
          .catch(() => {});
      }

      if (imagePrompt) {
        fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: imagePrompt,
            uid: `user-${Date.now()}`,
            characterId: chatState.character.id,
          }),
          signal: AbortSignal.timeout(30000),
        })
          .then(async imgRes => {
            if (!imgRes.ok) throw new Error('Image generation failed');
            const response = await imgRes.json();
            const { imageUri, r2Status, r2Error, isR2 } = response;
            
            console.log(`[Image] R2 Status: ${r2Status}, isR2: ${isR2}, Error: ${r2Error || 'none'}, URL: ${imageUri}`);
            
            const r2StatusText = r2Status === 'success' ? '✅ R2上传成功' : r2Status === 'failed' ? `❌ R2上传失败: ${r2Error}` : '⏭️ R2未尝试';
            console.log('[Image] Status:', r2StatusText);
            
            const imageMessage: Message = {
              id: `char-img-${Date.now()}`,
              role: 'character',
              type: 'image',
              content: imagePrompt,
              imageUri,
              imagePrompt,
              imageSource: isR2 ? 'r2' : 'temporary',
              timestamp: Date.now(),
            };
            
            console.log('[DEBUG] Image message created:', JSON.stringify({ imageUri, isR2, r2Status, r2Error }));
            setChatState(prev => ({
              ...prev,
              messages: [...prev.messages, imageMessage],
              isGeneratingImage: false,
            }));
          })
          .catch((err) => {
            console.error('[Image] Fetch failed:', err);
            setChatState(prev => ({
              ...prev,
              isGeneratingImage: false,
            }));
          });
      }
    } catch {
      const errorMessage: Message = {
        id: `char-error-${Date.now()}`,
        role: 'character',
        type: 'text',
        content: '网络不太好，等一下再试试～',
        timestamp: Date.now(),
      };
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isTyping: false,
        isGeneratingImage: false,
      }));
    } finally {
      isGeneratingRef.current = false;
    }
  }, [chatState.character, chatState.messages]);

  useEffect(() => {
    if (chatState.messages.length > 0 && chatState.character) {
      saveMessages(chatState.messages, chatState.character);
    }
  }, [chatState.messages, chatState.character, saveMessages]);

  return (
    <ChatContext.Provider value={{ chatState, user, selectCharacter, sendMessage, resetChat, login, logout }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
