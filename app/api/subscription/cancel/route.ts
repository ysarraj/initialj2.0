import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getUserFromRequest } from '@/src/lib/auth';
import { cancelSubscription, resumeSubscription, createPortalSession } from '@/src/lib/stripe';

// POST - Cancel or manage subscription
export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // 'cancel', 'resume', or 'portal'

    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    if (action === 'portal') {
      // Open Stripe customer portal
      if (!user.subscription.stripeCustomerId) {
        return NextResponse.json(
          { error: 'No Stripe customer ID found' },
          { status: 400 }
        );
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const session = await createPortalSession(
        user.subscription.stripeCustomerId,
        `${appUrl}/settings`
      );

      return NextResponse.json({ url: session.url });
    }

    if (action === 'cancel') {
      // Cancel at period end
      const updatedSub = await cancelSubscription(
        user.subscription.stripeSubscriptionId,
        true
      );

      await prisma.subscription.update({
        where: { userId: user.id },
        data: {
          cancelAtPeriodEnd: true,
        },
      });

      return NextResponse.json({
        success: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: updatedSub.current_period_end
          ? new Date(updatedSub.current_period_end * 1000)
          : null,
      });
    }

    if (action === 'resume') {
      // Resume canceled subscription
      await resumeSubscription(user.subscription.stripeSubscriptionId);

      await prisma.subscription.update({
        where: { userId: user.id },
        data: {
          cancelAtPeriodEnd: false,
        },
      });

      return NextResponse.json({
        success: true,
        cancelAtPeriodEnd: false,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Subscription action error:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription action' },
      { status: 500 }
    );
  }
}
