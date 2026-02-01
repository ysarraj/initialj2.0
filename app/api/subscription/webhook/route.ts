import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { stripe, mapStripeStatus, mapStripePriceToPlan } from '@/src/lib/stripe';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription' && session.subscription) {
          const userId = session.metadata?.userId;

          if (!userId) {
            console.error('No userId in checkout session metadata');
            break;
          }

          // Get the subscription details
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const priceId = subscription.items.data[0]?.price.id;
          const plan = mapStripePriceToPlan(priceId);

          // Update user subscription
          await prisma.subscription.upsert({
            where: { userId },
            update: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscription.id,
              plan: plan as 'FREE' | 'MONTHLY' | 'YEARLY',
              status: mapStripeStatus(subscription.status) as 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID',
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
            create: {
              userId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscription.id,
              plan: plan as 'FREE' | 'MONTHLY' | 'YEARLY',
              status: mapStripeStatus(subscription.status) as 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID',
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          });

          console.log(`Subscription activated for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.error('No userId in subscription metadata');
          break;
        }

        const priceId = subscription.items.data[0]?.price.id;
        const plan = mapStripePriceToPlan(priceId);

        await prisma.subscription.update({
          where: { userId },
          data: {
            plan: plan as 'FREE' | 'MONTHLY' | 'YEARLY',
            status: mapStripeStatus(subscription.status) as 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID',
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });

        console.log(`Subscription updated for user ${userId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.error('No userId in subscription metadata');
          break;
        }

        // Reset to free plan
        await prisma.subscription.update({
          where: { userId },
          data: {
            plan: 'FREE',
            status: 'CANCELED',
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          },
        });

        console.log(`Subscription canceled for user ${userId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.userId;

        if (!userId) break;

        await prisma.subscription.update({
          where: { userId },
          data: {
            status: 'PAST_DUE',
          },
        });

        console.log(`Payment failed for user ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
