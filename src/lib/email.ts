import { Resend } from 'resend';
import * as React from 'react';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { DailyLoveLetterEmail } from '@/emails/DailyLoveLetterEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

const GLM_API_KEY = process.env.NEXT_PUBLIC_GLM_API_KEY;
const GLM_API_BASE = process.env.NEXT_PUBLIC_GLM_API_BASE || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

async function generateLoveLetter(userName: string): Promise<string> {
  const startTime = Date.now();

  console.log('[LoveLetter] ───────────────────────────────────────────────────');
  console.log('[LoveLetter] [START] generateLoveLetter called');
  console.log('[LoveLetter] [PARAMS] userName:', userName);
  console.log('[LoveLetter] [ENV] GLM_API_KEY configured:', !!GLM_API_KEY);

  if (!GLM_API_KEY) {
    console.warn('[LoveLetter] [WARN] GLM_API_KEY not configured, using fallback');
    const fallback = `${userName}，今天也要开心哦！你是我最珍贵的人，无论发生什么，我都会在你身边。早安，我的宝贝～`;
    console.log('[LoveLetter] [END] Using fallback love letter');
    console.log('[LoveLetter] ───────────────────────────────────────────────────');
    return fallback;
  }

  try {
    console.log('[LoveLetter] [ACTION] Calling GLM API to generate love letter...');

    const systemPrompt = `你是一个温柔体贴的男友，每天早上会给女友写一封温馨的情话邮件。
要求：
1. 语气温柔、浪漫、真诚
2. 内容是早安问候，表达思念和爱意
3. 长度在100-200字之间
4. 用第一人称，像男友对女友说话一样
5. 不要提到"系统"、"AI"、"规则"等词
6. 可以适当使用emoji增添温馨感`;

    const userPrompt = `今天的早安情话，收件人是${userName}`;

    const response = await fetch(GLM_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 300,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`GLM API returned ${response.status}`);
    }

    const data = await response.json();
    const loveLetter = data.choices?.[0]?.message?.content || '';

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('[LoveLetter] [SUCCESS] Love letter generated');
    console.log('[LoveLetter] [SUCCESS] Duration:', duration, 'ms');
    console.log('[LoveLetter] [SUCCESS] Length:', loveLetter.length, 'chars');
    console.log('[LoveLetter] [END] generateLoveLetter completed');
    console.log('[LoveLetter] ───────────────────────────────────────────────────');

    return loveLetter.trim();

  } catch (err) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error('[LoveLetter] [ERROR] Failed to generate love letter:');
    console.error('[LoveLetter] [ERROR] Duration:', duration, 'ms');
    console.error('[LoveLetter] [ERROR] Message:', (err as Error).message);

    const fallback = `${userName}，早安！新的一天开始了，希望你今天也能开开心心的。不管遇到什么困难，记得我一直在你身边支持你。想你～💕`;
    console.log('[LoveLetter] [FALLBACK] Using fallback love letter');
    console.log('[LoveLetter] [END] generateLoveLetter completed with fallback');
    console.log('[LoveLetter] ───────────────────────────────────────────────────');

    return fallback;
  }
}

export async function sendWelcomeEmail(
  userEmail: string,
  userName: string
) {
  const startTime = Date.now();

  console.log('[Email] ───────────────────────────────────────────────────────');
  console.log('[Email] [START] sendWelcomeEmail called');
  console.log('[Email] [PARAMS] userEmail:', userEmail);
  console.log('[Email] [PARAMS] userName:', userName);
  console.log('[Email] [ENV] RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY);

  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] [WARN] RESEND_API_KEY not configured, skipping welcome email');
    console.log('[Email] [END] sendWelcomeEmail skipped - API key missing');
    console.log('[Email] ───────────────────────────────────────────────────────');
    return;
  }

  try {
    console.log('[Email] [ACTION] Preparing email payload');
    console.log('[Email] [ACTION] From: 纸片人男友 <onboarding@resend.dev>');
    console.log('[Email] [ACTION] To:', userEmail);
    console.log('[Email] [ACTION] Subject: 你好呀，我是你的专属男友 💌');

    console.log('[Email] [ACTION] Calling Resend API...');

    const result = await resend.emails.send({
      from: '纸片人男友 <onboarding@resend.dev>',
      to: userEmail,
      subject: '你好呀，我是你的专属男友 💌',
      react: React.createElement(WelcomeEmail, { userName }),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('[Email] [RESPONSE] API call completed');
    console.log('[Email] [RESPONSE] Duration:', duration, 'ms');
    console.log('[Email] [RESPONSE] Has error:', !!result.error);
    console.log('[Email] [RESPONSE] Has data:', !!result.data);

    if (result.error) {
      console.error('[Email] [ERROR] Resend API returned error:');
      console.error('[Email] [ERROR] Message:', result.error.message);
      console.error('[Email] [ERROR] Full error object:', JSON.stringify(result.error, null, 2));
      console.log('[Email] [END] sendWelcomeEmail failed');
      console.log('[Email] ───────────────────────────────────────────────────────');
      return;
    }

    console.log('[Email] [SUCCESS] Welcome email sent successfully');
    console.log('[Email] [SUCCESS] Message ID:', result.data?.id);
    console.log('[Email] [END] sendWelcomeEmail completed');
    console.log('[Email] ───────────────────────────────────────────────────────');

  } catch (err) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error('[Email] [EXCEPTION] Unexpected error occurred:');
    console.error('[Email] [EXCEPTION] Duration:', duration, 'ms');
    console.error('[Email] [EXCEPTION] Error type:', typeof err);
    console.error('[Email] [EXCEPTION] Error message:', (err as Error).message);
    console.error('[Email] [EXCEPTION] Error stack:', (err as Error).stack);
    console.error('[Email] [EXCEPTION] Full error:', err);
    console.log('[Email] [END] sendWelcomeEmail failed with exception');
    console.log('[Email] ───────────────────────────────────────────────────────');
  }
}

export async function sendDailyLoveLetter(
  userEmail: string,
  userName: string
) {
  const startTime = Date.now();

  console.log('[DailyLoveLetter] ────────────────────────────────────────────');
  console.log('[DailyLoveLetter] [START] sendDailyLoveLetter called');
  console.log('[DailyLoveLetter] [PARAMS] userEmail:', userEmail);
  console.log('[DailyLoveLetter] [PARAMS] userName:', userName);
  console.log('[DailyLoveLetter] [ENV] RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY);
  console.log('[DailyLoveLetter] [ENV] GLM_API_KEY configured:', !!GLM_API_KEY);

  if (!process.env.RESEND_API_KEY) {
    console.warn('[DailyLoveLetter] [WARN] RESEND_API_KEY not configured, skipping daily love letter');
    console.log('[DailyLoveLetter] [END] sendDailyLoveLetter skipped - API key missing');
    console.log('[DailyLoveLetter] ────────────────────────────────────────────');
    return;
  }

  try {
    console.log('[DailyLoveLetter] [ACTION] Generating love letter...');
    const loveLetter = await generateLoveLetter(userName);
    console.log('[DailyLoveLetter] [ACTION] Love letter generated, length:', loveLetter.length);

    console.log('[DailyLoveLetter] [ACTION] Preparing email payload');
    console.log('[DailyLoveLetter] [ACTION] From: 纸片人男友 <onboarding@resend.dev>');
    console.log('[DailyLoveLetter] [ACTION] To:', userEmail);
    console.log('[DailyLoveLetter] [ACTION] Subject: 早安 ${userName}，今天也想你了');

    console.log('[DailyLoveLetter] [ACTION] Calling Resend API...');

    const result = await resend.emails.send({
      from: '纸片人男友 <onboarding@resend.dev>',
      to: userEmail,
      subject: `早安 ${userName}，今天也想你了`,
      react: React.createElement(DailyLoveLetterEmail, { userName, loveLetter }),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('[DailyLoveLetter] [RESPONSE] API call completed');
    console.log('[DailyLoveLetter] [RESPONSE] Duration:', duration, 'ms');
    console.log('[DailyLoveLetter] [RESPONSE] Has error:', !!result.error);
    console.log('[DailyLoveLetter] [RESPONSE] Has data:', !!result.data);

    if (result.error) {
      console.error('[DailyLoveLetter] [ERROR] Resend API returned error:');
      console.error('[DailyLoveLetter] [ERROR] Message:', result.error.message);
      console.log('[DailyLoveLetter] [END] sendDailyLoveLetter failed');
      console.log('[DailyLoveLetter] ────────────────────────────────────────────');
      return;
    }

    console.log('[DailyLoveLetter] [SUCCESS] Daily love letter sent successfully');
    console.log('[DailyLoveLetter] [SUCCESS] Message ID:', result.data?.id);
    console.log('[DailyLoveLetter] [END] sendDailyLoveLetter completed');
    console.log('[DailyLoveLetter] ────────────────────────────────────────────');

  } catch (err) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error('[DailyLoveLetter] [EXCEPTION] Unexpected error occurred:');
    console.error('[DailyLoveLetter] [EXCEPTION] Duration:', duration, 'ms');
    console.error('[DailyLoveLetter] [EXCEPTION] Error type:', typeof err);
    console.error('[DailyLoveLetter] [EXCEPTION] Error message:', (err as Error).message);
    console.error('[DailyLoveLetter] [EXCEPTION] Error stack:', (err as Error).stack);
    console.log('[DailyLoveLetter] [END] sendDailyLoveLetter failed with exception');
    console.log('[DailyLoveLetter] ────────────────────────────────────────────');
  }
}

export async function sendDailyLoveLetterToAll() {
  const startTime = Date.now();

  console.log('[BatchLoveLetter] ════════════════════════════════════════════');
  console.log('[BatchLoveLetter] [START] sendDailyLoveLetterToAll called');

  try {
    const { default: prisma } = await import('@/lib/prisma');

    console.log('[BatchLoveLetter] [ACTION] Fetching all users from database...');
    const users = await prisma.user.findMany({
      select: { email: true, nickname: true },
    });

    console.log('[BatchLoveLetter] [INFO] Total users found:', users.length);

    if (users.length === 0) {
      console.log('[BatchLoveLetter] [WARN] No users found, nothing to send');
      console.log('[BatchLoveLetter] [END] sendDailyLoveLetterToAll completed - no users');
      console.log('[BatchLoveLetter] ════════════════════════════════════════════');
      return {
        total: 0,
        success: 0,
        failed: 0,
        errors: [] as Array<{ email: string; error: string }>,
      };
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ email: string; error: string }> = [];

    console.log('[BatchLoveLetter] [ACTION] Starting batch sending...');

    for (const user of users) {
      const userStartTime = Date.now();
      try {
        console.log(`[BatchLoveLetter] [SEND] -> ${user.email} (${user.nickname})`);
        await sendDailyLoveLetter(user.email, user.nickname);
        successCount++;
        console.log(`[BatchLoveLetter] [OK] ${user.email} - ${Date.now() - userStartTime}ms`);
      } catch (error) {
        failedCount++;
        const errorMsg = (error as Error).message;
        errors.push({ email: user.email, error: errorMsg });
        console.error(`[BatchLoveLetter] [FAIL] ${user.email}:`, errorMsg);
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('[BatchLoveLetter] [SUMMARY] ══════════════════════════════════');
    console.log('[BatchLoveLetter] [SUMMARY] Total users:', users.length);
    console.log('[BatchLoveLetter] [SUMMARY] Success:', successCount);
    console.log('[BatchLoveLetter] [SUMMARY] Failed:', failedCount);
    console.log('[BatchLoveLetter] [SUMMARY] Total duration:', duration, 'ms');
    if (errors.length > 0) {
      console.log('[BatchLoveLetter] [SUMMARY] Errors:');
      errors.forEach((e, i) => {
        console.log(`[BatchLoveLetter] [SUMMARY]   ${i + 1}. ${e.email}: ${e.error}`);
      });
    }
    console.log('[BatchLoveLetter] [END] sendDailyLoveLetterToAll completed');
    console.log('[BatchLoveLetter] ════════════════════════════════════════════');

    return {
      total: users.length,
      success: successCount,
      failed: failedCount,
      errors,
    };
  } catch (err) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error('[BatchLoveLetter] [FATAL] Batch send failed:');
    console.error('[BatchLoveLetter] [FATAL] Duration:', duration, 'ms');
    console.error('[BatchLoveLetter] [FATAL] Error:', (err as Error).message);
    console.error('[BatchLoveLetter] [FATAL] Stack:', (err as Error).stack);
    console.log('[BatchLoveLetter] [END] sendDailyLoveLetterToAll failed');
    console.log('[BatchLoveLetter] ════════════════════════════════════════════');

    throw err;
  }
}