'use client';

import { useChat } from '../context/ChatContext';

export default function TypingIndicator() {
  const { chatState } = useChat();
  const { character, isTyping } = chatState;

  if (!isTyping || !character) return null;

  return (
    <div className="flex items-start gap-2 mb-4">
      <img
        src={character.avatar}
        alt={character.name}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />
      <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">{character.name}正在输入...</p>
      </div>
    </div>
  );
}