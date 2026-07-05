import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email, nickname, password } = await request.json();

    if (!email || !nickname || !password) {
      return NextResponse.json(
        { message: '所有字段都是必填的' },
        { status: 400 }
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
