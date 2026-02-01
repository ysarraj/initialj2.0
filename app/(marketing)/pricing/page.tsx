'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/src/components/layout/Header';
import Footer from '@/src/components/layout/Footer';
import Button from '@/src/components/ui/Button';

const PLANS = [
  {
    name: 'Free',
    price: 'USD 0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'N5 Level (100 Kanji + Vocabulary)',
      'Relevant JLPT Vocabulary',
      'SRS System',
      'Progress Tracking',
    ],
    cta: 'Start Free',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Monthly',
    price: 'USD 3',
    period: 'per month',
    description: 'Full access, billed monthly',
    features: [
      'All JLPT Levels (N5-N1)',
      '2000+ Kanji',
      'Relevant Vocabulary for Each Level',
      'SRS System',
      'Progress Tracking',
    ],
    cta: 'Subscribe',
    href: '/register?plan=monthly',
    highlighted: false,
  },
  {
    name: 'Yearly',
    price: 'USD 30',
    period: 'per year',
    description: 'Best value - save USD 6',
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
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsAuthenticated(res.ok);
        } catch {
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleSubscribe = async (plan: 'monthly' | 'yearly', href: string) => {
    if (!isAuthenticated) {
      router.push(href);
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push(href);
      return;
    }

    try {
      const res = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      // Fallback to register page if subscription creation fails
      router.push(href);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Pricing */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-light text-dark-900 mb-4">
            Currently in Beta
          </h1>
          <p className="text-lg lg:text-xl text-dark-600 font-light">
            All levels are free during beta. Pricing will be available soon.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {PLANS.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative border transition-all duration-300 hover:shadow-lg hover:scale-105 animate-fadeIn ${
                plan.highlighted ? 'border-dark-900 animate-pulse-slow' : 'border-dark-200'
              } p-8`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-dark-900 text-white text-xs font-light tracking-wide px-4 py-1.5 uppercase animate-pulse-slow animate-glow">
                  {plan.badge}
                </div>
              )}
              <div className="text-center mb-8">
                <h3 className="text-xl font-light text-dark-900 mb-4 uppercase tracking-wide">
                  {plan.name}
                </h3>
                <div className="text-5xl lg:text-6xl font-light text-dark-900 mb-2">
                  {plan.price}
                </div>
                <div className="text-sm text-dark-500 font-light uppercase tracking-wide">
                  {plan.period}
                </div>
                <p className="text-sm text-dark-600 mt-4 font-light">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-dark-700 font-light">
                    <span className="text-dark-900 mt-0.5">—</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.name === 'Free' ? (
                <Link href={plan.href}>
                  <Button
                    variant={plan.highlighted ? 'primary' : 'secondary'}
                    fullWidth
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant={plan.highlighted ? 'primary' : 'secondary'}
                  fullWidth
                  size="lg"
                  onClick={() => {
                    const planType = plan.name === 'Monthly' ? 'monthly' : 'yearly';
                    handleSubscribe(planType, plan.href);
                  }}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : plan.cta}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-32 max-w-3xl mx-auto border-t border-dark-200 pt-16">
          <h2 className="text-3xl lg:text-4xl font-light text-dark-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="font-light text-lg text-dark-900 mb-2">Is N5 really free forever?</h3>
              <p className="text-dark-600 font-light">
                Yes! You can learn N5 kanji and relevant vocabulary completely free, with no time limit or credit card required.
              </p>
            </div>
            <div>
              <h3 className="font-light text-lg text-dark-900 mb-2">Can I cancel my subscription anytime?</h3>
              <p className="text-dark-600 font-light">
                Absolutely. Cancel anytime from your account settings. You'll keep access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-light text-lg text-dark-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-dark-600 font-light">
                We accept all major credit cards through Stripe, our secure payment processor.
              </p>
            </div>
            <div>
              <h3 className="font-light text-lg text-dark-900 mb-2">Do I lose my progress if I cancel?</h3>
              <p className="text-dark-600 font-light">
                No! Your progress is always saved. If you resubscribe later, you'll pick up right where you left off.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
