'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/src/components/layout/Header';
import Footer from '@/src/components/layout/Footer';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';

type PreviewItem = {
  character: string;
  romaji: string;
  script: 'Hiragana' | 'Katakana';
};

const PREVIEW_ITEMS: PreviewItem[] = [
  { character: 'あ', romaji: 'a', script: 'Hiragana' },
  { character: 'い', romaji: 'i', script: 'Hiragana' },
  { character: 'う', romaji: 'u', script: 'Hiragana' },
  { character: 'え', romaji: 'e', script: 'Hiragana' },
  { character: 'お', romaji: 'o', script: 'Hiragana' },
  { character: 'カ', romaji: 'ka', script: 'Katakana' },
  { character: 'キ', romaji: 'ki', script: 'Katakana' },
  { character: 'ク', romaji: 'ku', script: 'Katakana' },
  { character: 'ケ', romaji: 'ke', script: 'Katakana' },
  { character: 'コ', romaji: 'ko', script: 'Katakana' },
];

function matchesRomaji(answer: string, reading: string): boolean {
  const cleanAnswer = answer.trim().toLowerCase();
  const cleanReading = reading.trim().toLowerCase();

  if (cleanAnswer === cleanReading) return true;
  if (cleanReading.endsWith('nn') && cleanAnswer.endsWith('n')) {
    return cleanReading.slice(0, -2) === cleanAnswer.slice(0, -1);
  }
  if (cleanReading.endsWith('n') && cleanAnswer.endsWith('nn')) {
    return cleanReading.slice(0, -1) === cleanAnswer.slice(0, -2);
  }
  return false;
}

export default function PreviewPage() {
  const router = useRouter();
  const items = useMemo(
    () => [...PREVIEW_ITEMS].sort(() => Math.random() - 0.5),
    []
  );
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [answerState, setAnswerState] = useState<'pending' | 'correct' | 'incorrect'>('pending');
  const [showSignup, setShowSignup] = useState(false);
  const [completed, setCompleted] = useState(false);

  const current = items[index];
  const answeredCount = index;

  const handleSubmit = () => {
    if (!current || !input.trim()) return;
    const isCorrect = matchesRomaji(input, current.romaji);
    setAnswerState(isCorrect ? 'correct' : 'incorrect');
  };

  const handleNext = () => {
    if (!current) return;
    const nextIndex = index + 1;
    if (nextIndex >= items.length) {
      setCompleted(true);
      return;
    }
    setIndex(nextIndex);
    setInput('');
    setAnswerState('pending');
    if (nextIndex >= 3) {
      setShowSignup(true);
    }
  };

  useEffect(() => {
    if (completed || !current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        router.push('/');
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (answerState === 'correct') {
          handleNext();
        } else {
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answerState, completed, current, router]);

  if (!current || completed) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <section className="max-w-[900px] mx-auto px-6 sm:px-8 lg:px-12 py-20">
          <Card className="p-8 sm:p-10 text-center">
            <h1 className="text-3xl sm:text-4xl font-light text-dark-900 mb-4">
              Great start!
            </h1>
            <p className="text-dark-600 font-light mb-8">
              Create an account so we can save your progress and keep you on track.
            </p>
            <div className="space-y-3">
              <Button size="lg" fullWidth onClick={() => router.push('/register')}>
                Sign up to save progress
              </Button>
              <Button variant="secondary" fullWidth onClick={() => router.push('/login')}>
                I already have an account
              </Button>
            </div>
          </Card>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <section className="max-w-[900px] mx-auto px-6 sm:px-8 lg:px-12 py-20 space-y-6">
        <Card className="p-8 sm:p-10">
          <div className="text-center mb-6">
            <div className="text-xs uppercase tracking-wide text-dark-500 mb-2">
              {current.script} preview • Question {index + 1} of {items.length}
            </div>
            <div className="text-7xl sm:text-8xl font-light text-dark-900">
              {current.character}
            </div>
          </div>

          {answerState === 'correct' ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 font-light">Correct!</div>
              <div className="text-sm text-dark-500 font-light">
                Romaji: <span className="font-mono text-dark-900">{current.romaji}</span>
              </div>
              <Button size="lg" fullWidth onClick={handleNext}>
                Next
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (answerState === 'incorrect') setAnswerState('pending');
                }}
                placeholder="Type the romaji..."
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className={`w-full px-4 py-3 text-lg text-center rounded-xl border-2 outline-none transition-all ${
                  answerState === 'incorrect'
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-200 focus:border-dark-900 bg-white'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              {answerState === 'incorrect' && (
                <div className="text-sm text-red-500 text-center">Try again</div>
              )}
              <Button size="lg" fullWidth onClick={handleSubmit}>
                Submit
              </Button>
            </div>
          )}
        </Card>

        <div className="flex justify-center gap-3 text-xs text-dark-400 flex-wrap">
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">Enter</kbd> submit/next</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">Esc</kbd> exit</span>
        </div>

        {showSignup && (
          <Card className="p-6 border border-dark-200">
            <div className="text-center space-y-3">
              <div className="text-sm text-dark-600 font-light">
                Want to save your progress?
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button fullWidth onClick={() => router.push('/register')}>
                  Sign up
                </Button>
                <Button variant="secondary" fullWidth onClick={() => setShowSignup(false)}>
                  Keep practicing
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="text-center text-xs text-dark-400 font-light">
          Answered {answeredCount} of {items.length}
        </div>
      </section>
      <Footer />
    </main>
  );
}
