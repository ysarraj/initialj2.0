import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { hashPassword } from '@/src/lib/auth';
import { emailService } from '@/src/lib/email';

// Generate a random 4-digit code
function generateVerificationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Block temporary email addresses (yopmail)
    const emailLower = email.toLowerCase();
    if (emailLower.includes('yopmail')) {
      return NextResponse.json(
        { error: 'Please don\'t use temporary email addresses' },
        { status: 400 }
      );
    }

    // Check password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Code expires in 10 minutes

    // Delete any existing verification codes for this email
    await prisma.verificationCode.deleteMany({
      where: { email: emailLower },
    });

    // Store verification code with user data
    await prisma.verificationCode.create({
      data: {
        email: emailLower,
        code,
        password: hashedPassword,
        username: username || null,
        expiresAt,
      },
    });

    // Send verification code via email
    const emailSent = await emailService.sendVerificationCode(emailLower, code);

    if (!emailSent) {
      // Clean up verification code if email failed
      await prisma.verificationCode.deleteMany({
        where: { email: emailLower },
      });
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Verification code sent to your email',
      email: emailLower,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register' },
      { status: 500 }
    );
  }
}
