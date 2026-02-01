'use client';

import Link from 'next/link';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';

const PLANS = [
  {
    name: 'Free',
    price: 'CHF 0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'N5 Level (100 Kanji)',
      'Basic Vocabulary',
      'SRS System',
      'Progress Tracking',
    ],
    cta: 'Start Free',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Monthly',
    price: 'CHF 2',
    period: 'per month',
    description: 'Full access, billed monthly',
    features: [
      'All JLPT Levels (N5-N1)',
      '2000+ Kanji',
      '6000+ Vocabulary',
      'SRS System',
      'Progress Tracking',
    ],
    cta: 'Subscribe',
    href: '/register?plan=monthly',
    highlighted: false,
  },
  {
    name: 'Yearly',
    price: 'CHF 20',
    period: 'per year',
    description: 'Best value - save CHF 4',
    features: [
      'All JLPT Levels (N5-N1)',
      '2000+ Kanji',
      '6000+ Vocabulary',
      'SRS System',
      'Progress Tracking',
      'Priority Support',
    ],
    cta: 'Subscribe',
    href: '/register?plan=yearly',
    highlighted: true,
    badge: 'Best Value',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              InitialJ
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Start Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Pricing */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-gray-600">
              Start free with N5 level. Upgrade anytime for full access.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.highlighted ? 'ring-2 ring-pink-500 scale-105' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold mb-1">{plan.price}</div>
                  <div className="text-sm text-gray-500">{plan.period}</div>
                  <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <span className="text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href={plan.href}>
                  <Button
                    variant={plan.highlighted ? 'primary' : 'secondary'}
                    fullWidth
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Is N5 really free forever?</h3>
                <p className="text-gray-600">
                  Yes! You can learn 100 N5 kanji completely free, with no time limit or credit card required.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Can I cancel my subscription anytime?</h3>
                <p className="text-gray-600">
                  Absolutely. Cancel anytime from your account settings. You'll keep access until the end of your billing period.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600">
                  We accept all major credit cards through Stripe, our secure payment processor.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Do I lose my progress if I cancel?</h3>
                <p className="text-gray-600">
                  No! Your progress is always saved. If you resubscribe later, you'll pick up right where you left off.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8 px-4 mt-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xl font-bold">
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              InitialJ
            </span>
          </div>
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} InitialJ. Master Japanese, one kanji at a time.
          </div>
        </div>
      </footer>
    </div>
  );
}
