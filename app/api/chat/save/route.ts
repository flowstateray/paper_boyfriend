import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Message } from '@/types/chat';

interface SaveRequest {
  userId: string;
  characterId: string;
  characterName: string;
  messages: Message[];
}

export async function POST(request: NextRequest) {
  try {
    const { userId, characterId, characterName, messages }: SaveRequest = await request.json();

    if (!userId || !characterId || !messages.length) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    let session = await prisma.session.findFirst({
      where: { userId, characterId },
    });

    if (!session) {
      session = await prisma.session.create({
        data: {
          userId,
          characterId,
          characterName,
        },
      });
    }

    const sessionId = session.id;

    const existingMessageIds = new Set(
      (await prisma.message.findMany({
        where: { sessionId },
        select: { id: true },
      })).map(m => m.id)
    );

    const newMessages = messages.filter(m => !existingMessageIds.has(m.id));

    if (newMessages.length > 0) {
      await prisma.message.createMany({
        data: newMessages.map(m => ({
          id: m.id,
          sessionId,
          role: m.role,
          type: m.type,
          content: m.content,
          imageUri: m.imageUri || undefined,
          audioUri: m.audioUri || undefined,
          timestamp: new Date(m.timestamp),
        })),
      });
    }

    return NextResponse.json({ success: true, sessionId, savedCount: newMessages.length });
  } catch (error) {
    console.error('Save chat error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
