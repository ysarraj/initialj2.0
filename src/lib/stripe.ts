import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

// Price IDs from environment
export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID || '',
  yearly: process.env.STRIPE_YEARLY_PRICE_ID || '',
};

// Pricing info for display
export const PRICING = {
  free: {
    name: 'Free',
    price: 0,
    period: 'forever',
    features: [
      'N5 Level (100 Kanji)',
      'Basic Vocabulary',
      'SRS System',
      'Progress Tracking',
    ],
  },
  monthly: {
    name: 'Monthly',
    price: 2,
    period: 'month',
    features: [
      'All JLPT Levels (N5-N1)',
      '2000+ Kanji',
      '6000+ Vocabulary',
      'SRS System',
      'Progress Tracking',
    ],
  },
  yearly: {
    name: 'Yearly',
    price: 20,
    period: 'year',
    savings: 4,
    features: [
      'All JLPT Levels (N5-N1)',
      '2000+ Kanji',
      '6000+ Vocabulary',
      'SRS System',
      'Progress Tracking',
      'Priority Support',
    ],
  },
};

// Create checkout session
export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
  });

  return session;
}

// Create customer portal session
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// Get subscription from Stripe
export async function getStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch {
    return null;
  }
}

// Cancel subscription
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: cancelAtPeriodEnd,
  });
}

// Resume subscription (undo cancellation)
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

// Map Stripe subscription status to our status
export function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'ACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'unpaid':
      return 'UNPAID';
    case 'canceled':
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
    default:
      return 'CANCELED';
  }
}

// Map Stripe price to our plan
export function mapStripePriceToPlan(priceId: string): string {
  if (priceId === STRIPE_PRICES.monthly) return 'MONTHLY';
  if (priceId === STRIPE_PRICES.yearly) return 'YEARLY';
  return 'FREE';
}
