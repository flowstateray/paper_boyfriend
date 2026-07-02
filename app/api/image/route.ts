import { NextRequest, NextResponse } from 'next/server';
import { CharacterId } from '@/types/chat';
import { characters } from '@/data/characters';

interface ImageRequest {
  prompt: string;
  uid: string;
  characterId?: CharacterId;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, uid, characterId } = await request.json();

    let enhancedPrompt = prompt;
    
    if (characterId && typeof characterId === 'string' && characters[characterId as CharacterId]) {
      enhancedPrompt = `${characters[characterId as CharacterId].appearance}。${prompt}`;
    }

    enhancedPrompt = `male character, ${enhancedPrompt}。anime style, high quality, detailed, full body or portrait, 8k resolution。不要出现文字。`;

    const pollinationsBase = process.env.NEXT_PUBLIC_POLLINATIONS_BASE || 'https://image.pollinations.ai';
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    
    const imageUri = `${pollinationsBase}/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;

    return NextResponse.json({ imageUri });
  } catch {
    return NextResponse.json({ imageUri: '' });
  }
}