'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import Input from '@/src/components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Implement password reset email
    // For now, just show success message
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSubmitted(true);
    setLoading(false);
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
        </div>

        <Card>
          {submitted ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="text-xl font-semibold mb-2">Check your email</h2>
              <p className="text-gray-600 mb-6">
                If an account exists for {email}, we've sent password reset instructions.
              </p>
              <Link href="/login">
                <Button variant="secondary" fullWidth>
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-2 text-center">Forgot your password?</h2>
              <p className="text-gray-600 text-sm text-center mb-6">
                Enter your email and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  fullWidth
                />

                <Button type="submit" fullWidth loading={loading}>
                  Send Reset Link
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-600">
                Remember your password?{' '}
                <Link href="/login" className="text-pink-600 hover:text-pink-700 font-medium">
                  Log in
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
