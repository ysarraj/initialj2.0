import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/src/lib/auth';
import { createPortalSession } from '@/src/lib/stripe';
import prisma from '@/src/lib/db';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      include: { subscription: true },
    });

    if (!user?.subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      );
    }

    const returnUrl = `${request.nextUrl.origin}/settings`;
    const url = await createPortalSession(user.subscription.stripeCustomerId, returnUrl);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
