import { NextRequest, NextResponse } from 'next/server';
import { CharacterId } from '@/types/chat';
import { characters } from '@/data/characters';
import { uploadToR2 } from '@/lib/r2';
import { nanoid } from 'nanoid';

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
    
    const tempImageUrl = `${pollinationsBase}/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;

    const imageResponse = await fetch(tempImageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ imageUrl: '' });
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const fileName = `images/${nanoid()}.png`;
    
    let permanentUrl: string | null = null;
    try {
      permanentUrl = await uploadToR2(imageBuffer, fileName, 'image/png');
      console.log(`[R2] Upload successful: ${permanentUrl}`);
    } catch (r2Error) {
      console.error(`[R2] Upload failed, using temporary URL:`, (r2Error as Error).message);
    }

    return NextResponse.json({ imageUrl: permanentUrl || tempImageUrl });
  } catch (error) {
    console.error(`[Image API] Error:`, (error as Error).message);
    return NextResponse.json({ imageUrl: '' });
  }
}