'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/src/components/layout/Header';
import Button from '@/src/components/ui/Button';
import Input from '@/src/components/ui/Input';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

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
        body: JSON.stringify({ email, password, username }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      // Check if email verification was skipped (SMTP failure fallback)
      if (data.skipVerification) {
        // User was created without email verification - redirect to login
        router.push('/login?registered=true');
        return;
      }

      // Code sent successfully
      setCodeSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (verificationCode.length !== 4) {
      setError('Please enter the 4-digit code');
      return;
    }

    setVerifying(true);

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      // Store token
      localStorage.setItem('auth_token', data.token);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-light text-dark-900 mb-4">
              Create Account
            </h1>
            <p className="text-lg text-dark-600 font-light">
              Start learning Japanese kanji and vocabulary - currently in beta, all levels are free
            </p>
          </div>

          {!codeSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Input
                label="Username (optional)"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
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

              <Button type="submit" fullWidth loading={loading} size="lg">
                Send Verification Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm mb-4">
                Verification code sent to <strong>{email}</strong>. Please check your email.
              </div>

              <Input
                label="Verification Code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                maxLength={4}
                required
                fullWidth
                autoFocus
              />

              <Button type="submit" fullWidth loading={verifying} size="lg">
                Verify Code
              </Button>

              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => {
                  setCodeSent(false);
                  setVerificationCode('');
                  setError('');
                }}
              >
                Change Email
              </Button>
            </form>
          )}

          <p className="mt-6 text-xs text-center text-dark-500 font-light">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>

          <div className="mt-8 text-center text-sm text-dark-600 font-light">
            Already have an account?{' '}
            <Link href="/login" className="text-dark-900 hover:underline font-light">
              Log in
            </Link>
          </div>

          {/* Beta notice */}
          <p className="mt-8 text-center text-sm text-dark-500 font-light">
            Currently in beta - all levels are free. No credit card required.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
          <div className="max-w-md mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-900 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
