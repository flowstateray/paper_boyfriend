'use client';

import Script from 'next/script';

interface TawkChatProps {
  id?: string;
  embedId?: string;
}

export default function TawkChat({
  id = '6a4b98bafe1c9c1d48b57957',
  embedId = '1jsrkp6ht',
}: TawkChatProps) {
  return (
    <Script
      src={`https://embed.tawk.to/${id}/${embedId}`}
      async
      charSet="UTF-8"
      crossOrigin="anonymous"
    />
  );
}