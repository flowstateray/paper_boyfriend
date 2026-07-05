import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { turnstileToken, email, nickname, password } = await request.json();

    if (!email || !nickname || !password) {
      return NextResponse.json(
        { message: '所有字段都是必填的' },
        { status: 400 }
      );
    }

    const verifyResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
        }),
      }
    );

    const verifyResult = await verifyResponse.json();

    if (!verifyResult.success) {
      console.error('[Turnstile] Verification failed:', verifyResult);
      return NextResponse.json(
        { message: '人机验证失败，请重试' },
        { status: 403 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: '该邮箱已被注册' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        nickname,
        password: hashedPassword,
      },
    });

    console.log('[Email] Calling sendWelcomeEmail for:', email);
    sendWelcomeEmail(email, nickname).catch((err) => {
      console.error('[Email] Failed to send welcome email:', err);
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
