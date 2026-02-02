'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/src/components/layout/Header';
import Footer from '@/src/components/layout/Footer';
import Button from '@/src/components/ui/Button';

const JLPT_LEVELS = [
  { level: 'N5', kanji: '100', description: 'Basic', free: true },
  { level: 'N4', kanji: '300', description: 'Elementary', free: false },
  { level: 'N3', kanji: '650', description: 'Intermediate', free: false },
  { level: 'N2', kanji: '1000', description: 'Advanced', free: false },
  { level: 'N1', kanji: '2000', description: 'Proficient', free: false },
];

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem('auth_token');
          setIsLoggedIn(false);
        }
      } catch (error) {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  const handleStartLearning = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggedIn) {
      router.push('/dashboard');
    } else {
      router.push('/preview');
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section - Mode Designs style */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-32 lg:py-48">
        <div className="text-center">
          <div 
            className="text-[120px] lg:text-[180px] mb-12 leading-none bg-clip-text text-transparent font-light"
            style={{ 
              backgroundImage: 'linear-gradient(135deg, #1F2922 0%, #C73E1D 50%, #1F2922 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradient-animate 3s ease infinite'
            }}
          >
            InitialJ
          </div>
          <h1 className="text-5xl lg:text-7xl font-light text-dark-900 mb-8 tracking-tight">
            Master Japanese Kanji & Vocabulary
          </h1>
          <p className="text-xl lg:text-2xl text-dark-600 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Learn kanji and relevant vocabulary for each JLPT level through spaced repetition. Currently in beta - all levels are free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeIn">
            <Button 
              size="lg" 
              className="px-8 py-4 text-lg animate-pulse-slow"
              onClick={handleStartLearning}
            >
              Start Learning
            </Button>
            {!isLoggedIn && (
              <Link href="/login">
                <Button variant="ghost" size="lg" className="px-8 py-4 text-lg">Log in</Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* JLPT Levels - Minimalist grid */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-32 border-t border-dark-200">
        <div className="mb-16 text-center">
          <h2 className="text-4xl lg:text-5xl font-light text-dark-900 mb-4">
            JLPT Levels
          </h2>
          <p className="text-lg text-dark-600 font-light">
            From basic to proficient
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          {JLPT_LEVELS.map((level, index) => (
            <Link
              key={level.level}
              href={level.level === 'N5' ? '/dashboard' : `/dashboard?jlpt=${level.level.replace('N', '')}`}
              className="text-center group cursor-pointer hover:scale-105 transition-all duration-300 animate-fadeIn"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-6xl lg:text-7xl font-light text-dark-900 mb-4 tracking-tight transition-transform hover:scale-110">
                {level.level}
              </div>
              <div className="text-2xl lg:text-3xl font-light text-dark-700 mb-2 transition-colors hover:text-dark-900">
                {level.kanji} kanji + vocab
              </div>
              <div className="text-sm text-dark-500 mb-4 uppercase tracking-wide">
                {level.description}
              </div>
              <span className="inline-block px-4 py-1.5 bg-dark-900 text-white text-xs font-medium tracking-wider uppercase animate-pulse-slow hover:scale-110 transition-transform">
                Beta
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Mission Section */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-32 border-t border-dark-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-light text-dark-900 mb-8">
            For the Art of Learning
          </h2>
          <p className="text-lg lg:text-xl text-dark-600 font-light leading-relaxed">
            We design learning experiences that feel just right, from the structure of each lesson 
            to the science behind spaced repetition. Every detail is considered, from first concept to mastery.
          </p>
        </div>
      </section>

      {/* CTA Section - Minimalist */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-32 border-t border-dark-200">
        <div className="text-center">
          <h2 className="text-4xl lg:text-5xl font-light text-dark-900 mb-8">
            Start Building Your Japanese Knowledge
          </h2>
          <p className="text-lg text-dark-600 mb-12 font-light max-w-2xl mx-auto">
            Select your JLPT level, choose your pace, and begin your journey to Japanese mastery with kanji and vocabulary.
          </p>
          <Button 
            size="lg" 
            className="px-10 py-5 text-lg"
            onClick={(e) => {
              e.preventDefault();
              if (isLoggedIn) {
                router.push('/dashboard');
              } else {
                router.push('/register');
              }
            }}
          >
            Get Started
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
