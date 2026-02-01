'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/src/components/layout/Header';
import Button from '@/src/components/ui/Button';
import Input from '@/src/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      // Store token
      localStorage.setItem('auth_token', data.token);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-light text-dark-900 mb-4">
              Welcome Back
            </h1>
            <p className="text-lg text-dark-600 font-light">
              Log in to continue your Japanese learning journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

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
              placeholder="••••••••"
              required
              fullWidth
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-dark-200" />
                <span className="text-dark-600 font-light">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-dark-600 hover:text-dark-900 font-light">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg">
              Log In
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-dark-600 font-light">
            Don't have an account?{' '}
            <Link href="/register" className="text-dark-900 hover:underline font-light">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
