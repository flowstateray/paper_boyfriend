'use client';

import { X } from 'lucide-react';

interface ImageViewerProps {
  imageUri: string;
  onClose: () => void;
}

export default function ImageViewer({ imageUri, onClose }: ImageViewerProps) {
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
      >
        <X className="w-8 h-8" />
      </button>
      <img
        src={imageUri}
        alt="Full size"
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}