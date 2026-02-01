import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getUserFromRequest } from '@/src/lib/auth';
import { createCheckoutSession, STRIPE_PRICES } from '@/src/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body;

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const priceId = plan === 'monthly' ? STRIPE_PRICES.monthly : STRIPE_PRICES.yearly;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        subscription: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has an active paid subscription
    if (user.subscription?.plan !== 'FREE' && user.subscription?.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      );
    }

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${appUrl}/dashboard?subscription=success`;
    const cancelUrl = `${appUrl}/pricing?subscription=canceled`;

    const session = await createCheckoutSession(
      user.id,
      user.email,
      priceId,
      successUrl,
      cancelUrl
    );

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
