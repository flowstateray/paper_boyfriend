'use client';

import { useState } from 'react';
import { Message } from '../types/chat';
import VoicePlayer from './VoicePlayer';
import ImageViewer from './ImageViewer';
import { ImageIcon } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  characterAvatar?: string;
  speaker?: string;
}

export default function MessageBubble({ message, characterAvatar, speaker }: MessageBubbleProps) {
  const [showImageViewer, setShowImageViewer] = useState(false);

  if (message.role === 'user') {
    return (
      <div className="flex justify-end items-start gap-2 mb-4">
        <div className="aurora-border bg-white/90 text-black rounded-2xl rounded-br-none px-4 py-2 max-w-[70%]">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium text-sm flex-shrink-0 border border-gray-600">
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
          className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-700"
        />
        <div className="aurora-border bg-gray-900/80 rounded-2xl rounded-bl-none overflow-hidden max-w-[240px]">
          {message.imageUri ? (
            <div className="relative">
              <img
                src={message.imageUri}
                alt={message.content}
                className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowImageViewer(true)}
              />
              <div className="absolute bottom-2 right-2 px-3 py-1 bg-black/70 rounded-full text-xs text-white font-medium z-10">
                {message.imageSource === 'r2' ? '✅ R2存储' : '❌ 临时链接'}
              </div>
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-800/50 flex flex-col items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
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
        className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-700"
      />
      <div className="flex flex-col gap-2">
        <div className="aurora-border bg-gray-900/80 rounded-2xl rounded-bl-none px-4 py-2 max-w-[70%]">
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="aurora-border bg-gray-900/80 rounded-2xl rounded-bl-none px-4 py-2">
          <VoicePlayer audioUri={message.audioUri} text={message.content} speaker={speaker} />
        </div>
      </div>
    </div>
  );
}
