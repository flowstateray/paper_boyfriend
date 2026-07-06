import { sendDailyLoveLetterToAll } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  console.log('[Cron] ═══════════════════════════════════════════════════');
  console.log('[Cron] [START] Daily email cron job triggered');
  console.log('[Cron] [INFO] Request from:', request.headers.get('user-agent'));

  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET?.trim();

  console.log('[Cron] [DEBUG] Auth header received:', authHeader);
  console.log('[Cron] [DEBUG] CRON_SECRET configured:', cronSecret ? 'yes' : 'no');
  if (cronSecret) {
    console.log('[Cron] [DEBUG] Expected auth header:', `Bearer ${cronSecret}`);
  }

  if (!cronSecret) {
    console.error('[Cron] [ERROR] CRON_SECRET environment variable is not set or is empty');
    console.log('[Cron] [END] Aborted - missing CRON_SECRET');
    console.log('[Cron] ═══════════════════════════════════════════════════');
    return NextResponse.json(
      { error: '服务器配置错误' },
      { status: 500 }
    );
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[Cron] [WARN] Unauthorized - no Bearer token provided');
    console.log('[Cron] [END] Aborted - unauthorized');
    console.log('[Cron] ═══════════════════════════════════════════════════');
    return NextResponse.json(
      { error: '未授权访问' },
      { status: 401 }
    );
  }

  const providedToken = authHeader.substring('Bearer '.length).trim();
  if (providedToken !== cronSecret) {
    console.warn('[Cron] [WARN] Unauthorized - token mismatch');
    console.warn('[Cron] [WARN] Provided token:', providedToken);
    console.warn('[Cron] [WARN] Provided token length:', providedToken.length);
    console.warn('[Cron] [WARN] Expected token length:', cronSecret.length);
    console.log('[Cron] [END] Aborted - unauthorized');
    console.log('[Cron] ═══════════════════════════════════════════════════');
    return NextResponse.json(
      { error: '未授权访问' },
      { status: 401 }
    );
  }

  console.log('[Cron] [INFO] Authorization verified');
  console.log('[Cron] [ACTION] Starting daily love letter batch in background...');

  sendDailyLoveLetterToAll().then(result => {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('[Cron] [SUCCESS] Daily email cron job completed');
    console.log('[Cron] [SUCCESS] Total users:', result.total);
    console.log('[Cron] [SUCCESS] Success:', result.success);
    console.log('[Cron] [SUCCESS] Failed:', result.failed);
    console.log('[Cron] [SUCCESS] Duration:', duration, 'ms');
    console.log('[Cron] [END] Cron job finished successfully');
    console.log('[Cron] ═══════════════════════════════════════════════════');
  }).catch(error => {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error('[Cron] [FATAL] Daily email cron job failed:');
    console.error('[Cron] [FATAL] Duration:', duration, 'ms');
    console.error('[Cron] [FATAL] Error:', (error as Error).message);
    console.error('[Cron] [FATAL] Stack:', (error as Error).stack);
    console.log('[Cron] [END] Cron job failed');
    console.log('[Cron] ═══════════════════════════════════════════════════');
  });

  return NextResponse.json({
    ok: true,
    message: '每日情话发送任务已启动，将在后台处理',
    time: new Date().toISOString(),
    status: 'processing',
  });
}
