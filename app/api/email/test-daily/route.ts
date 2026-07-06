import { NextResponse } from 'next/server';
import { sendDailyLoveLetter } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email, nickname } = await request.json();

    if (!email || !nickname) {
      return NextResponse.json(
        { message: '邮箱和昵称都是必填的' },
        { status: 400 }
      );
    }

    console.log('[TestDaily] Testing daily love letter email to:', email);

    await sendDailyLoveLetter(email, nickname);

    return NextResponse.json({
      message: '每日情话邮件测试发送完成',
      email,
      nickname,
    });
  } catch (error) {
    console.error('[TestDaily] Error:', error);
    return NextResponse.json(
      { message: '发送失败', error: (error as Error).message },
      { status: 500 }
    );
  }
}
