'use client';

import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { characterList } from '../data/characters';
import Link from 'next/link';
import { LogIn, LogOut, User } from 'lucide-react';

export default function CharacterSelect() {
  const { selectCharacter, user, logout } = useChat();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState<string | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative z-10 cursor-none">
      <div 
        className="fixed pointer-events-none z-40"
        style={{
          left: mousePos.x,
          top: -100,
          width: 300,
          height: '120vh',
          transform: 'translateX(-50%)',
          background: `radial-gradient(ellipse 300px 800px at 50% 0%, rgba(0, 245, 255, 0.5) 0%, rgba(157, 78, 221, 0.35) 25%, rgba(255, 255, 255, 0.15) 45%, transparent 75%)`,
          opacity: isHovering ? 1 : 0.5,
          transition: 'opacity 0.3s ease',
        }}
      />

      <div 
        className="fixed pointer-events-none z-50"
        style={{
          left: mousePos.x - 12,
          top: mousePos.y - 12,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path 
            d="M12 2L14.5 8L21 9L16 14L17.5 21L12 17L6.5 21L8 14L3 9L9.5 8L12 2Z" 
            fill="#ff69b4"
            stroke="#9d4edd"
            strokeWidth="1.5"
          />
          <circle cx="12" cy="16" r="2" fill="#ff69b4" />
        </svg>
      </div>

      <div className="max-w-5xl w-full">
        <div className="flex justify-end mb-8">
          <div className="flex gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/10 rounded-full">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-gray-300">{user.nickname}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/10 rounded-full hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-all text-sm text-gray-300 hover:text-cyan-400"
                >
                  <LogOut className="w-4 h-4" />
                  退出
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/10 rounded-full hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-all text-sm text-gray-300 hover:text-cyan-400"
                >
                  <LogIn className="w-4 h-4" />
                  登录
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-sm text-white hover:opacity-90 transition-all"
                >
                  <User className="w-4 h-4" />
                  注册
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="text-center mb-16">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div 
              className="absolute inset-0 rounded-full animate-ping opacity-75"
              style={{
                background: 'radial-gradient(circle, rgba(0, 245, 255, 0.5) 0%, rgba(157, 78, 221, 0.4) 50%, transparent 70%)',
              }}
            />
            <div 
              className="absolute inset-4 rounded-full animate-ping opacity-50"
              style={{
                animationDelay: '0.5s',
                background: 'radial-gradient(circle, rgba(157, 78, 221, 0.5) 0%, rgba(0, 245, 255, 0.3) 50%, transparent 70%)',
              }}
            />
            <div 
              className="relative w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(30, 30, 30, 0.8)',
                border: '2px solid rgba(0, 245, 255, 0.5)',
                boxShadow: '0 0 30px rgba(0, 245, 255, 0.4), 0 0 60px rgba(157, 78, 221, 0.3)',
              }}
            >
              <span 
                className="text-4xl"
                style={{
                  color: '#ff69b4',
                  textShadow: '0 0 10px rgba(255, 105, 180, 0.8), 0 0 20px rgba(0, 245, 255, 0.5)',
                }}
              >♥</span>
            </div>
          </div>
          <h1 
            className="text-5xl font-bold mb-4"
            style={{
              color: '#ffffff',
              textShadow: '0 0 20px rgba(0, 245, 255, 0.5), 0 0 40px rgba(157, 78, 221, 0.3)',
            }}
          >纸片人男友</h1>
          <p className="text-gray-400 text-lg">选择你的专属虚拟男友，开始甜蜜聊天吧～</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {characterList.map((character) => (
            <div
              key={character.id}
              onClick={() => selectCharacter(character)}
              onMouseEnter={() => setIsHovering(character.id)}
              onMouseLeave={() => setIsHovering(null)}
              className="group cursor-pointer relative"
            >
              {isHovering === character.id && (
                <div 
                  className="absolute -top-4 -left-4 -right-4 -bottom-4 pointer-events-none transition-opacity duration-300"
                  style={{
                    background: 'radial-gradient(ellipse 300px 400px at 50% -20%, rgba(0, 245, 255, 0.15) 0%, rgba(157, 78, 221, 0.1) 30%, rgba(255, 105, 180, 0.05) 50%, transparent 75%)',
                    filter: 'blur(10px)',
                    borderRadius: '24px',
                  }}
                />
              )}

              <div 
                className={`rounded-xl p-6 backdrop-blur-xl transition-all duration-300 h-full ${isHovering === character.id ? 'scale-[1.03]' : 'hover:scale-[1.02]'}`}
                style={{
                  background: 'rgba(30, 30, 30, 0.6)',
                  border: isHovering === character.id 
                    ? '1px solid rgba(0, 245, 255, 0.3)' 
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  boxShadow: isHovering === character.id 
                    ? '0 0 30px rgba(0, 245, 255, 0.3), 0 0 60px rgba(157, 78, 221, 0.15), 0 10px 40px -10px rgba(0, 0, 0, 0.4)'
                    : '0 10px 40px -10px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div className="relative h-48 flex items-center justify-center mb-4 overflow-hidden rounded-lg">
                  <div 
                    className={`absolute inset-0 transition-opacity duration-300 ${isHovering === character.id ? 'opacity-100' : 'opacity-0'}`}
                    style={{
                      background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.2), rgba(157, 78, 221, 0.15))',
                    }}
                  />
                  <img
                    src={character.avatar}
                    alt={character.name}
                    className={`relative w-32 h-32 rounded-full object-cover transition-all duration-300 ${isHovering === character.id ? 'scale-110 brightness-110' : 'group-hover:scale-110'}`}
                    style={{
                      boxShadow: isHovering === character.id 
                        ? '0 0 25px rgba(0, 245, 255, 0.4)' 
                        : 'none',
                    }}
                  />
                </div>
                <div className="text-center">
                  <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${isHovering === character.id ? 'text-cyan-400' : 'text-white'}`}>
                    {character.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-1 leading-relaxed">{character.tagline}</p>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">{(character as any).taglineEn}</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {character.tags.map(tag => (
                      <span
                        key={tag}
                        className={`px-3 py-1 rounded-full text-xs transition-all duration-300 ${isHovering === character.id 
                          ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300' 
                          : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
