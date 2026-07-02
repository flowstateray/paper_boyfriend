'use client';

import { useState } from 'react';
import { Message } from '../types/chat';
import VoicePlayer from './VoicePlayer';
import ImageViewer from './ImageViewer';
import { ImageIcon } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  characterAvatar?: string;
}

export default function MessageBubble({ message, characterAvatar }: MessageBubbleProps) {
  const [showImageViewer, setShowImageViewer] = useState(false);

  if (message.role === 'user') {
    return (
      <div className="flex justify-end items-start gap-2 mb-4">
        <div className="bg-green-500 text-white rounded-2xl rounded-br-none px-4 py-2 max-w-[70%] shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
          我
        </div>
      </div>
    );
  }

  if (message.type === 'image') {
    return (
      <div className="flex items-start gap-2 mb-4">
        <img
          src={characterAvatar}
          alt="Character"
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
        <div className="bg-white rounded-2xl rounded-bl-none shadow-sm overflow-hidden max-w-[240px]">
          {message.imageUri ? (
            <img
              src={message.imageUri}
              alt={message.content}
              className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setShowImageViewer(true)}
            />
          ) : (
            <div className="w-full h-48 bg-gray-100 flex flex-col items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-xs text-gray-500">图片加载失败</p>
            </div>
          )}
        </div>
        {showImageViewer && message.imageUri && (
          <ImageViewer imageUri={message.imageUri} onClose={() => setShowImageViewer(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 mb-4">
      <img
        src={characterAvatar}
        alt="Character"
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />
      <div className="flex flex-col gap-2">
        <div className="bg-white rounded-2xl rounded-bl-none px-4 py-2 shadow-sm max-w-[70%]">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        {message.audioUri && (
          <div className="bg-white rounded-2xl rounded-bl-none px-4 py-2 shadow-sm">
            <VoicePlayer audioUri={message.audioUri} />
          </div>
        )}
      </div>
    </div>
  );
}