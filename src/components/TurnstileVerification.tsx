'use client';

import { useState, useCallback } from 'react';
import Turnstile from 'react-turnstile';

interface TurnstileVerificationProps {
  onVerified: (token: string) => void;
  onExpired?: () => void;
}

export default function TurnstileVerification({ onVerified, onExpired }: TurnstileVerificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSuccess = useCallback((token: string) => {
    setIsLoading(true);
    setError('');
    onVerified(token);
    setIsLoading(false);
  }, [onVerified]);

  const handleError = useCallback((errorCode: any) => {
    console.error('Turnstile error:', errorCode);
    setError('验证失败，请重试');
  }, []);

  const handleExpired = useCallback(() => {
    onExpired?.();
    setError('验证已过期，请重新验证');
  }, [onExpired]);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-gray-400 text-sm">Turnstile 未配置，跳过验证</p>
        <button
          onClick={() => onVerified('skip')}
          className="mt-4 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full text-sm transition-colors"
        >
          继续
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-6">
      {error && (
        <p className="text-red-400 text-sm mb-4 animate-pulse">{error}</p>
      )}
      <Turnstile
        sitekey={siteKey}
        onSuccess={handleSuccess}
        onError={handleError}
        onExpire={handleExpired}
        onTimeout={handleExpired}
        theme="dark"
        size="normal"
        language="zh-CN"
      />
      {isLoading && (
        <div className="mt-4 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-cyan-400 text-sm">验证中...</span>
        </div>
      )}
    </div>
  );
}
