'use client';

interface ContactFooterProps {
  email?: string;
  label?: string;
  className?: string;
}

export default function ContactFooter({
  email = 'flowgithub@proton.me',
  label = '联系邮箱',
  className = '',
}: ContactFooterProps) {
  return (
    <footer className={`fixed bottom-0 left-0 right-0 text-center py-4 text-white text-2xl bg-black/80 backdrop-blur-sm border-t border-gray-800 ${className}`}>
      <p>💌 {label}: <a href={`mailto:${email}`} className="text-pink-400 hover:text-pink-300 transition-colors font-bold">{email}</a></p>
    </footer>
  );
}