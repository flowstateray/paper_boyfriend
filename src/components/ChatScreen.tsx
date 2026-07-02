'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { Send, ArrowLeft, MoreVertical } from 'lucide-react';

export default function ChatScreen() {
  const { chatState, sendMessage, resetChat } = useChat();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages]);

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content) return;
    sendMessage(content);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chatState.character) return null;

  const character = chatState.character;

  return (
    <div className="min-h-screen bg-[#EDEDED] flex flex-col max-w-[600px] mx-auto">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={resetChat}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <img
              src={character.avatar}
              alt={character.name}
              className="w-9 h-9 rounded-full object-cover"
            />
            <div>
              <h2 className="font-semibold text-gray-800">{character.name}</h2>
              <p className="text-xs text-green-500">在线</p>
            </div>
          </div>
        </div>
        <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {chatState.messages.map(message => (
          <MessageBubble
            key={message.id}
            message={message}
            characterAvatar={character.avatar}
            speaker={character.speaker}
          />
        ))}
        <TypingIndicator />
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-white px-4 py-3 sticky bottom-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              className="w-full bg-transparent border-none outline-none text-gray-800 text-sm"
              disabled={chatState.isTyping}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || chatState.isTyping}
            className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </footer>
    </div>
  );
}