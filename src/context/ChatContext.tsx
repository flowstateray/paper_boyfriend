'use client';

import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { Character, Message, ChatState } from '../types/chat';
import { parseReply } from '../utils/parseReply';
import { cleanTextForSpeech } from '../utils/cleanText';

interface ChatContextType {
  chatState: ChatState;
  selectCharacter: (character: Character) => void;
  sendMessage: (content: string) => void;
  resetChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [chatState, setChatState] = useState<ChatState>({
    character: null,
    messages: [],
    isTyping: false,
    isGeneratingImage: false,
  });

  const isGeneratingRef = useRef(false);

  const selectCharacter = useCallback((character: Character) => {
    setChatState({
      character,
      messages: [],
      isTyping: false,
      isGeneratingImage: false,
    });
  }, []);

  const resetChat = useCallback(() => {
    setChatState({
      character: null,
      messages: [],
      isTyping: false,
      isGeneratingImage: false,
    });
  }, []);

  const sendMessage = useCallback(async (content: string) => {
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
            setChatState(prev => ({
              ...prev,
              messages: prev.messages.map(msg =>
                msg.id === characterTextMessage.id
                  ? { ...msg, audioUri }
                  : msg
              ),
            }));
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
            const { imageUri } = await imgRes.json();
            const imageMessage: Message = {
              id: `char-img-${Date.now()}`,
              role: 'character',
              type: 'image',
              content: imagePrompt,
              imageUri,
              imagePrompt,
              timestamp: Date.now(),
            };
            setChatState(prev => ({
              ...prev,
              messages: [...prev.messages, imageMessage],
              isGeneratingImage: false,
            }));
          })
          .catch(() => {
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

  return (
    <ChatContext.Provider value={{ chatState, selectCharacter, sendMessage, resetChat }}>
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