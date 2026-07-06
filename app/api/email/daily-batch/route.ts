import { NextResponse } from 'next/server';
import { sendDailyLoveLetterToAll } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[DailyBatch] Unauthorized attempt - missing/invalid secret');
      return NextResponse.json(
        { message: '未授权' },
        { status: 401 }
      );
    }

    console.log('[DailyBatch] Triggered, starting batch send...');

    const result = await sendDailyLoveLetterToAll();

    return NextResponse.json({
      message: '批量每日情话邮件发送完成',
      ...result,
    });
  } catch (error) {
    console.error('[DailyBatch] Error:', error);
    return NextResponse.json(
      {
        message: '批量发送失败',
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
