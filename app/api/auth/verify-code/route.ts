import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { generateToken } from '@/src/lib/auth';
import { emailService } from '@/src/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    // Validate input
    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Find verification code
    const verification = await prisma.verificationCode.findFirst({
      where: {
        email: email.toLowerCase(),
        code,
        expiresAt: {
          gt: new Date(), // Code must not be expired
        },
      },
      orderBy: {
        createdAt: 'desc', // Get the most recent code
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Check if user already exists (race condition check)
    const existingUser = await prisma.user.findUnique({
      where: { email: verification.email },
    });

    if (existingUser) {
      // Clean up verification code
      await prisma.verificationCode.deleteMany({
        where: { email: verification.email },
      });
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create user with stored data
    const user = await prisma.user.create({
      data: {
        email: verification.email,
        password: verification.password,
        username: verification.username,
        role: 'USER',
        subscription: {
          create: {
            plan: 'FREE',
            status: 'ACTIVE',
          },
        },
        settings: {
          create: {},
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    // Clean up verification code
    await prisma.verificationCode.deleteMany({
      where: { email: verification.email },
    });

    // Send welcome email (don't wait for it to complete)
    emailService.sendWelcomeEmail(user.email, user.username).catch((error) => {
      console.error('Failed to send welcome email:', error);
      // Don't fail the registration if email fails
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      user,
      token,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
