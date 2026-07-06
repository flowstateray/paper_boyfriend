import { sendDailyLoveLetterToAll } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  console.log('[Cron] ═══════════════════════════════════════════════════');
  console.log('[Cron] [START] Daily email cron job triggered');
  console.log('[Cron] [INFO] Request from:', request.headers.get('user-agent'));

  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron] [ERROR] CRON_SECRET environment variable is not set');
    console.log('[Cron] [END] Aborted - missing CRON_SECRET');
    console.log('[Cron] ═══════════════════════════════════════════════════');
    return NextResponse.json(
      { error: '服务器配置错误' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[Cron] [WARN] Unauthorized access attempt');
    console.warn('[Cron] [WARN] Auth header provided:', authHeader ? 'yes' : 'no');
    console.log('[Cron] [END] Aborted - unauthorized');
    console.log('[Cron] ═══════════════════════════════════════════════════');
    return NextResponse.json(
      { error: '未授权访问' },
      { status: 401 }
    );
  }

  console.log('[Cron] [INFO] Authorization verified');
  console.log('[Cron] [ACTION] Starting daily love letter batch...');

  try {
    const result = await sendDailyLoveLetterToAll();

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('[Cron] [SUCCESS] Daily email cron job completed');
    console.log('[Cron] [SUCCESS] Total users:', result.total);
    console.log('[Cron] [SUCCESS] Success:', result.success);
    console.log('[Cron] [SUCCESS] Failed:', result.failed);
    console.log('[Cron] [SUCCESS] Duration:', duration, 'ms');
    console.log('[Cron] [END] Cron job finished successfully');
    console.log('[Cron] ═══════════════════════════════════════════════════');

    return NextResponse.json({
      ok: true,
      message: '每日情话发送完成',
      time: new Date().toISOString(),
      duration: `${duration}ms`,
      ...result,
    });
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error('[Cron] [FATAL] Daily email cron job failed:');
    console.error('[Cron] [FATAL] Duration:', duration, 'ms');
    console.error('[Cron] [FATAL] Error:', (error as Error).message);
    console.error('[Cron] [FATAL] Stack:', (error as Error).stack);
    console.log('[Cron] [END] Cron job failed');
    console.log('[Cron] ═══════════════════════════════════════════════════');

    return NextResponse.json(
      {
        error: '发送失败',
        message: (error as Error).message,
        time: new Date().toISOString(),
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}
