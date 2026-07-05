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
    <div className="min-h-screen bg-black/80 pattern-dots flex flex-col max-w-[600px] mx-auto relative z-10">
      <header className="aurora-border bg-gray-900/90 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={resetChat}
            className="w-8 h-8 rounded-full hover:bg-gray-800 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <img
                src={character.avatar}
                alt={character.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-cyan-500/50"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-cyan-400 rounded-full border-2 border-gray-900 animate-pulse" />
            </div>
            <div>
              <h2 className="font-semibold text-white">{character.name}</h2>
              <p className="text-xs text-cyan-400">在线</p>
            </div>
          </div>
        </div>
        <button className="w-8 h-8 rounded-full hover:bg-gray-800 flex items-center justify-center transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-300" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 relative">
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at bottom, rgba(0, 245, 255, 0.3) 0%, transparent 60%)',
            animation: 'aurora-pulse 5s ease-in-out infinite',
          }}
        />
        {chatState.messages.map((message, index) => (
          <div 
            key={message.id} 
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <MessageBubble
              message={message}
              characterAvatar={character.avatar}
              speaker={character.speaker}
            />
          </div>
        ))}
        <TypingIndicator />
        <div ref={messagesEndRef} />
      </main>

      <footer className="aurora-border bg-gray-900/90 px-4 py-3 sticky bottom-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-full px-4 py-2 focus-within:border-cyan-400/50 transition-colors">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-gray-500"
              disabled={chatState.isTyping}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || chatState.isTyping}
            className="w-10 h-10 aurora-border rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </footer>
    </div>
  );
}