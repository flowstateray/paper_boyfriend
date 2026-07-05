import { NextRequest, NextResponse } from 'next/server';
import { CharacterId } from '@/types/chat';

interface ChatRequest {
  characterId: CharacterId;
  systemPrompt: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
}

export async function POST(request: NextRequest) {
  try {
    const { systemPrompt, messages }: ChatRequest = await request.json();

    const apiKey = process.env.NEXT_PUBLIC_GLM_API_KEY;
    const apiBase = process.env.NEXT_PUBLIC_GLM_API_BASE || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

    if (!apiKey) {
      return NextResponse.json({ reply: '请先配置GLM API密钥' });
    }

    const glmMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
    ];

    const response = await fetch(apiBase, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: glmMessages,
        temperature: 0.8,
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error('LLM API request failed');
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || data.content || '嗯，我在听～';

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: '网络不太好，等一下再试试～' });
  }
}