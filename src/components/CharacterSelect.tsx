'use client';

import { useChat } from '../context/ChatContext';
import { characterList } from '../data/characters';

export default function CharacterSelect() {
  const { selectCharacter } = useChat();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">纸片人男友</h1>
          <p className="text-gray-600 text-lg">选择你的专属虚拟男友，开始甜蜜聊天吧～</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {characterList.map(character => (
            <div
              key={character.id}
              onClick={() => selectCharacter(character)}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden group"
            >
              <div className="relative h-48 bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                <img
                  src={character.avatar}
                  alt={character.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{character.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{character.tagline}</p>
                <div className="flex flex-wrap gap-2">
                  {character.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-pink-100 text-pink-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}