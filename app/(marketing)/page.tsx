'use client';

import Link from 'next/link';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';

const FEATURES = [
  {
    icon: '🎯',
    title: 'Spaced Repetition',
    description: 'Scientifically proven SRS system ensures you remember what you learn forever.',
  },
  {
    icon: '📈',
    title: 'Track Progress',
    description: 'Watch your kanji knowledge grow with detailed statistics and progress tracking.',
  },
  {
    icon: '🆓',
    title: 'N5 Free Forever',
    description: 'Start learning with 100 essential kanji completely free. No credit card required.',
  },
  {
    icon: '⚡',
    title: 'Learn Fast',
    description: 'Bite-sized lessons and quick reviews fit into your busy schedule.',
  },
];

const JLPT_LEVELS = [
  { level: 'N5', kanji: '100', description: 'Basic', free: true },
  { level: 'N4', kanji: '300', description: 'Elementary', free: false },
  { level: 'N3', kanji: '650', description: 'Intermediate', free: false },
  { level: 'N2', kanji: '1000', description: 'Advanced', free: false },
  { level: 'N1', kanji: '2000', description: 'Proficient', free: false },
];

export default function LandingPage() {
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
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Start Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-8xl mb-6 font-japanese">漢字</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Master Japanese Kanji with{' '}
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              InitialJ
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Learn 2000+ kanji through spaced repetition. Start with N5 level completely free,
            then unlock N4-N1 with a simple subscription.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Start Learning Free →
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary" size="lg" className="text-lg px-8">
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            No credit card required • N5 level free forever
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Learn with InitialJ?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* JLPT Levels */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            All JLPT Levels Covered
          </h2>
          <p className="text-center text-gray-600 mb-12">
            From beginner to advanced, we've got you covered
          </p>
          <div className="grid grid-cols-5 gap-4">
            {JLPT_LEVELS.map((level) => (
              <Card
                key={level.level}
                className={`text-center ${level.free ? 'ring-2 ring-pink-500' : ''}`}
              >
                <div className={`text-2xl font-bold mb-1 ${level.free ? 'text-pink-500' : 'text-gray-900'}`}>
                  {level.level}
                </div>
                <div className="text-3xl font-japanese mb-2">{level.kanji}</div>
                <div className="text-xs text-gray-500">{level.description}</div>
                {level.free && (
                  <div className="mt-2 text-xs font-medium text-pink-600 bg-pink-50 rounded-full px-2 py-1">
                    FREE
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Learn New Kanji</h3>
              <p className="text-sm text-gray-600">
                Study kanji and vocabulary with meanings, readings, and mnemonics
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Practice with SRS</h3>
              <p className="text-sm text-gray-600">
                Review items at optimal intervals to move them to long-term memory
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Master & Burn</h3>
              <p className="text-sm text-gray-600">
                Once mastered, items are &quot;burned&quot; - you know them forever!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-gray-600 mb-8">
            Join thousands of learners mastering Japanese kanji with InitialJ.
            Start with N5 level completely free.
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-10">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xl font-bold">
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              InitialJ
            </span>
          </div>
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} InitialJ. Master Japanese, one kanji at a time.
          </div>
          <div className="flex gap-6 text-sm text-gray-600">
            <Link href="/pricing" className="hover:text-gray-900">Pricing</Link>
            <a href="mailto:support@initialj.com" className="hover:text-gray-900">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
