import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface LoadRequest {
  userId: string;
  characterId: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, characterId }: LoadRequest = await request.json();

    if (!userId || !characterId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const session = await prisma.session.findFirst({
      where: { userId, characterId },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ success: true, messages: [] });
    }

    const messages = session.messages.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'character',
      type: m.type as 'text' | 'image',
      content: m.content,
      imageUri: m.imageUri || undefined,
      imagePrompt: m.imagePrompt || undefined,
      imageSource: m.imageSource || undefined,
      audioUri: m.audioUri || undefined,
      timestamp: m.timestamp.getTime(),
    }));

    return NextResponse.json({ success: true, messages, sessionId: session.id });
  } catch (error) {
    console.error('Load chat error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
