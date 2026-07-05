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
      return NextResponse.json({ imageUri: '', error: 'Image generation failed' });
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const fileName = `images/${nanoid()}.png`;
    
    let permanentUrl: string | null = null;
    let r2Status: 'success' | 'failed' | 'skipped' = 'skipped';
    let r2Error: string | null = null;
    
    try {
      permanentUrl = await uploadToR2(imageBuffer, fileName, 'image/png');
      r2Status = 'success';
    } catch (r2ErrorObj) {
      r2Status = 'failed';
      r2Error = (r2ErrorObj as Error).message;
    }

    console.log(`[Image API] R2 Status: ${r2Status}, URL: ${permanentUrl || tempImageUrl}, Error: ${r2Error || 'none'}`);
    
    return NextResponse.json({ 
      imageUri: permanentUrl || tempImageUrl,
      r2Status,
      r2Error,
      isR2: !!permanentUrl,
      statusText: permanentUrl ? 'R2_UPLOAD_SUCCESS' : 'R2_UPLOAD_FAILED_' + (r2Error?.substring(0, 50) || 'unknown')
    });
  } catch (error) {
    console.error(`[Image API] Error:`, (error as Error).message);
    return NextResponse.json({ imageUri: '', error: (error as Error).message });
  }
}