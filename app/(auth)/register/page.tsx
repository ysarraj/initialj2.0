'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import Input from '@/src/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      // Store token
      localStorage.setItem('auth_token', data.token);

      // If plan was selected, redirect to checkout
      if (plan === 'monthly' || plan === 'yearly') {
        const checkoutRes = await fetch('/api/subscription/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.token}`,
          },
          body: JSON.stringify({ plan }),
        });

        const checkoutData = await checkoutRes.json();

        if (checkoutRes.ok && checkoutData.url) {
          window.location.href = checkoutData.url;
          return;
        }
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              InitialJ
            </span>
          </Link>
          <p className="text-gray-600 mt-2">
            {plan ? `Create your account to subscribe to the ${plan} plan` : 'Create your free account to start learning Japanese'}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="Name (optional)"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              fullWidth
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              fullWidth
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              fullWidth
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              fullWidth
            />

            <Button type="submit" fullWidth loading={loading}>
              {plan ? 'Create Account & Subscribe' : 'Create Free Account'}
            </Button>
          </form>

          <p className="mt-4 text-xs text-center text-gray-500">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-pink-600 hover:text-pink-700 font-medium">
              Log in
            </Link>
          </div>
        </Card>

        {/* Free tier notice */}
        {!plan && (
          <p className="mt-6 text-center text-sm text-gray-500">
            🎉 N5 level (100 kanji) is free forever. No credit card required.
          </p>
        )}
      </div>
    </div>
  );
}
