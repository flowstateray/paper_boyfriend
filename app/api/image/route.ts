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
    const { prompt, uid, characterId }: ImageRequest = await request.json();

    let enhancedPrompt = prompt;
    if (characterId && characters[characterId]) {
      enhancedPrompt = `${characters[characterId].appearance}。${prompt}`;
    }

    enhancedPrompt = `${enhancedPrompt}。画风要求：动漫风格，高质量，精细。不要出现文字。`;

    const pollinationsBase = process.env.NEXT_PUBLIC_POLLINATIONS_BASE || 'https://image.pollinations.ai';
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    
    const imageUri = `${pollinationsBase}/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;

    return NextResponse.json({ imageUri });
  } catch {
    return NextResponse.json({ imageUri: '' });
  }
}