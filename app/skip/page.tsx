'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/src/components/layout/Header';
import Footer from '@/src/components/layout/Footer';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';

const JLPT_LABELS: Record<number, string> = {
  1: 'N1',
  2: 'N2',
  3: 'N3',
  4: 'N4',
  5: 'N5',
};

function SkipContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jlptParam = Number(searchParams.get('jlpt'));
  const targetJlpt = Number.isFinite(jlptParam) ? jlptParam : 5;
  const label = JLPT_LABELS[targetJlpt] ?? 'N5';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiresSkip = useMemo(() => targetJlpt > 5 || targetJlpt < 1 ? false : targetJlpt < 5, [targetJlpt]);

  const handleSkip = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    const confirmSkip = window.confirm(
      `Skip to ${label}? This will burn all previous levels.`
    );
    if (!confirmSkip) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/lessons/skip-jlpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetJlpt }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to skip levels');
      }

      if (data.targetLessonId) {
        router.push(`/lessons/${data.targetLessonId}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip levels');
    } finally {
      setLoading(false);
    }
  }, [label, router, targetJlpt]);

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <section className="max-w-[900px] mx-auto px-6 sm:px-8 lg:px-12 py-20">
        <Card className="p-8 sm:p-10">
          <div className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl font-light text-dark-900">
              Skip to {label}
            </h1>
            <p className="text-dark-600 font-light">
              This will burn all previous levels so you can start from {label} immediately.
            </p>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-4">
            {requiresSkip ? (
              <>
                <Button size="lg" fullWidth onClick={handleSkip} loading={loading}>
                  Skip to {label}
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => router.push('/dashboard')}
                >
                  Back to Dashboard
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                fullWidth
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard
              </Button>
            )}
          </div>
        </Card>
      </section>
      <Footer />
    </main>
  );
}

export default function SkipPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white">
          <Header />
          <section className="max-w-[900px] mx-auto px-6 sm:px-8 lg:px-12 py-20">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-900" />
            </div>
          </section>
          <Footer />
        </main>
      }
    >
      <SkipContent />
    </Suspense>
  );
}
