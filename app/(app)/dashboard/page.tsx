'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import Link from 'next/link';

interface StageData {
  stage: number;
  name: string;
  kanji: number;
  vocab: number;
}

interface ProgressData {
  totals: { kanji: number; vocab: number; lessons: number };
  learned: { kanji: number; vocab: number };
  burned: { kanji: number; vocab: number };
  pendingReviews: { total: number; kanji: number; vocab: number };
  stageData: StageData[];
  currentLevel: number;
  accuracy: number;
  nextReviewAt: string | null;
}

interface Lesson {
  id: string;
  level: number;
  title: string;
  description: string;
  kanjiCount: number;
  vocabCount: number;
  kanjiStarted: number;
  vocabStarted: number;
  isUnlocked: boolean;
  isComplete: boolean;
  progress: number;
  isAccessible: boolean;
}

const STAGE_COLORS: Record<number, string> = {
  0: '#e5e5e5', // Locked - gray
  1: '#1F2922', // Apprentice 1
  2: '#2B322B', // Apprentice 2
  3: '#373A34', // Apprentice 3
  4: '#4E4B46', // Apprentice 4
  5: '#6D685F', // Guru 1
  6: '#8C8578', // Guru 2
  7: '#C9BEAA', // Master
  8: '#DED7BD', // Enlightened
  9: '#C73E1D', // Burned
};

export default function DashboardPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllLevels, setShowAllLevels] = useState(false);
  const [selectedJlpt, setSelectedJlpt] = useState<number | null>(null);

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const [progressRes, lessonsRes] = await Promise.all([
          fetch('/api/progress', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/lessons', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!progressRes.ok || !lessonsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const progressData = await progressRes.json();
        const lessonsData = await lessonsRes.json();

        setProgress(progressData);
        setLessons(lessonsData.lessons);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const formatNextReview = (dateStr: string | null) => {
    if (!dateStr) return 'No upcoming reviews';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();

    if (diffMs <= 0) return 'Now';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dark-200 pb-8">
        <div>
          <h1 className="text-4xl lg:text-5xl font-light mb-2">
            <span 
              className="bg-clip-text text-transparent"
              style={{ 
                backgroundImage: 'linear-gradient(135deg, #1F2922 0%, #C73E1D 50%, #1F2922 100%)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradient-animate 3s ease infinite'
              }}
            >
              InitialJ
            </span>
            <span className="text-dark-900"> Dashboard</span>
          </h1>
          <p className="text-lg text-dark-600 font-light">Master Japanese kanji and vocabulary with spaced repetition</p>
        </div>
        {progress && progress.pendingReviews.total > 0 && (
          <Link href="/reviews">
            <Button size="lg" className="animate-pulse-slow">
              Start Reviews ({progress.pendingReviews.total})
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      {progress && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="text-center p-6 hover:border-dark-900 hover:shadow-md transition-all duration-300 hover:scale-105 animate-fadeIn">
            <div className="text-4xl lg:text-5xl font-light text-dark-900 mb-2 transition-transform hover:scale-110">{progress.learned.kanji}</div>
            <div className="text-sm text-dark-600 font-light uppercase tracking-wide mb-1">Kanji Learned</div>
            <div className="text-xs text-dark-400 font-light">of {progress.totals.kanji}</div>
          </Card>
          <Card className="text-center p-6 hover:border-dark-900 hover:shadow-md transition-all duration-300 hover:scale-105 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            <div className="text-4xl lg:text-5xl font-light text-dark-900 mb-2 transition-transform hover:scale-110">{progress.learned.vocab}</div>
            <div className="text-sm text-dark-600 font-light uppercase tracking-wide mb-1">Vocabulary</div>
            <div className="text-xs text-dark-400 font-light">of {progress.totals.vocab}</div>
          </Card>
          <Link href="/burned" className="block">
            <Card className="text-center p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fadeIn" style={{ animationDelay: '0.2s', borderColor: STAGE_COLORS[9] }}>
              <div className="text-4xl lg:text-5xl font-light mb-2 transition-transform hover:scale-110" style={{ color: STAGE_COLORS[9] }}>{progress.burned.kanji + progress.burned.vocab}</div>
              <div className="text-sm font-light uppercase tracking-wide mb-1" style={{ color: STAGE_COLORS[9] }}>Burned</div>
              <div className="text-xs text-dark-400 font-light">Click to manage</div>
            </Card>
          </Link>
          <Card className="text-center p-6 hover:border-dark-900 hover:shadow-md transition-all duration-300 hover:scale-105 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <div className="text-4xl lg:text-5xl font-light text-dark-900 mb-2 transition-transform hover:scale-110">{progress.accuracy}%</div>
            <div className="text-sm text-dark-600 font-light uppercase tracking-wide mb-1">Accuracy</div>
            <div className="text-xs text-dark-400 font-light">Overall score</div>
          </Card>
        </div>
      )}

      {/* Reviews Section */}
      {progress && (
        <Card className="p-8 hover:shadow-lg transition-all duration-300 animate-fadeIn">
          <h2 className="text-2xl font-light text-dark-900 mb-8 uppercase tracking-wide">Reviews</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 border border-dark-200 hover:border-dark-900 hover:shadow-md transition-all duration-300 hover:scale-105">
              <div className="text-5xl font-light text-dark-900 mb-2 transition-transform hover:scale-110">{progress.pendingReviews.total}</div>
              <div className="text-sm text-dark-600 font-light uppercase tracking-wide">Pending Reviews</div>
            </div>
            <div className="text-center p-6 border border-dark-200 hover:border-dark-900 hover:shadow-md transition-all duration-300 hover:scale-105">
              <div className="text-2xl font-light text-dark-900 mb-2 transition-transform hover:scale-110">
                {formatNextReview(progress.nextReviewAt)}
              </div>
              <div className="text-sm text-dark-600 font-light uppercase tracking-wide">Next Review</div>
            </div>
            <div className="flex items-center justify-center">
              {progress.pendingReviews.total > 0 ? (
                <Link href="/reviews" className="w-full">
                  <Button fullWidth size="lg" className="animate-pulse-slow">Start Reviews</Button>
                </Link>
              ) : (
                <div className="text-center text-dark-600 font-light">
                  <p className="text-lg animate-float">All caught up!</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* SRS Stage Distribution */}
      {progress && (
        <Card className="p-8 hover:shadow-lg transition-all duration-300 animate-fadeIn">
          <h2 className="text-2xl font-light text-dark-900 mb-8 uppercase tracking-wide">SRS Progress</h2>
          <div className="space-y-4">
            {progress.stageData.filter(s => s.stage > 0).map((stage, index) => {
              const total = stage.kanji + stage.vocab;
              const maxTotal = Math.max(...progress.stageData.map(s => s.kanji + s.vocab), 1);
              const width = (total / maxTotal) * 100;

              return (
                <div 
                  key={stage.stage} 
                  className="flex items-center gap-4 hover:scale-[1.02] transition-all duration-200 animate-fadeIn"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="w-32 text-sm text-dark-600 font-light uppercase tracking-wide">{stage.name}</div>
                  <div className="flex-1 h-2 bg-dark-100 overflow-hidden hover:h-3 transition-all duration-200">
                    <div
                      className="h-full transition-all duration-700 hover:opacity-80"
                      style={{ 
                        width: `${width}%`,
                        backgroundColor: STAGE_COLORS[stage.stage] || STAGE_COLORS[0]
                      }}
                    />
                  </div>
                  <div className="w-16 text-sm text-right text-dark-500 font-light transition-transform hover:scale-110">{total}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Levels */}
      <div>
        <div className="flex items-center justify-between mb-8 border-b border-dark-200 pb-4">
          <h2 className="text-2xl font-light text-dark-900 uppercase tracking-wide">Levels</h2>
          {/* JLPT Filter */}
          <div className="flex gap-2">
            {[null, 5, 4, 3, 2, 1].map((jlpt) => (
              <button
                key={jlpt ?? 'all'}
                onClick={() => setSelectedJlpt(jlpt)}
                className={`px-4 py-1.5 text-xs font-light uppercase tracking-wide transition-all duration-200 hover:scale-110 active:scale-95 ${
                  selectedJlpt === jlpt
                    ? 'bg-dark-900 text-white animate-pulse-slow shadow-lg'
                    : 'bg-white border border-dark-200 text-dark-600 hover:border-dark-900 hover:shadow-md'
                }`}
              >
                {jlpt === null ? 'All' : `N${jlpt}`}
              </button>
            ))}
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(() => {
            // Filter lessons by JLPT level
            const filteredLessons = selectedJlpt === null
              ? lessons
              : lessons.filter(l => {
                  const level = l.level;
                  if (selectedJlpt === 5) return level >= 1 && level <= 10;
                  if (selectedJlpt === 4) return level >= 11 && level <= 25;
                  if (selectedJlpt === 3) return level >= 26 && level <= 50;
                  if (selectedJlpt === 2) return level >= 51 && level <= 75;
                  if (selectedJlpt === 1) return level >= 76 && level <= 100;
                  return true;
                });

            // Show all filtered levels, or first 15 if not filtered and not expanded
            const displayLessons = (selectedJlpt !== null || showAllLevels)
              ? filteredLessons
              : filteredLessons.slice(0, 15);

            return displayLessons.map((lesson, index) => {
              const isCurrentLevel = lesson.isUnlocked && !lesson.isComplete &&
                (index === 0 || lessons[index - 1]?.isComplete);

              return (
                <div
                  key={lesson.id}
                  className={`relative p-6 transition-all duration-300 border ${
                    !lesson.isUnlocked
                      ? 'bg-dark-50 border-dark-200 cursor-not-allowed opacity-50'
                      : lesson.isComplete
                      ? 'bg-white border-dark-900 cursor-pointer hover:border-dark-900 hover:shadow-lg hover:scale-[1.02]'
                      : isCurrentLevel
                      ? 'bg-white border-dark-900 cursor-pointer hover:border-dark-900 hover:shadow-lg hover:scale-[1.02]'
                      : 'bg-white border-dark-200 cursor-pointer hover:border-dark-900 hover:shadow-md hover:scale-[1.01]'
                  }`}
                  onClick={() => {
                    if (lesson.isUnlocked) {
                      router.push(`/lessons/${lesson.id}`);
                    }
                  }}
                >
                  {isCurrentLevel && (
                    <div className="absolute -top-2 -right-2 bg-dark-900 text-white text-xs px-3 py-1 font-light uppercase tracking-wide animate-pulse-slow animate-glow cursor-pointer hover:scale-110 transition-transform">
                      Current
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-4xl font-light ${
                        lesson.isComplete ? 'text-dark-900' :
                        lesson.isUnlocked ? 'text-dark-900' : 'text-dark-400'
                      }`}>
                        {lesson.level}
                      </span>
                      {lesson.isComplete && <span className="text-dark-900 text-xl">—</span>}
                    </div>
                    {!lesson.isUnlocked && (
                      <span className="text-dark-400 font-light">Locked</span>
                    )}
                  </div>

                  <h3 className={`font-light text-lg mb-3 ${
                    !lesson.isUnlocked ? 'text-dark-400' : 'text-dark-900'
                  }`}>
                    {lesson.title.split(' - ')[0]}
                  </h3>

                  <div className={`flex gap-4 text-xs font-light uppercase tracking-wide mb-4 ${
                    !lesson.isUnlocked ? 'text-dark-400' : 'text-dark-500'
                  }`}>
                    <span>{lesson.kanjiCount} kanji</span>
                    <span>{lesson.vocabCount} vocab</span>
                  </div>

                  {/* Progress bar for unlocked lessons */}
                  {lesson.isUnlocked && (
                    <div className="mt-4">
                      <div className="h-1 bg-dark-100 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 bg-dark-900`}
                          style={{ width: `${lesson.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-2 font-light text-dark-500">
                        <span className={lesson.isComplete ? 'text-dark-900' : 'text-dark-500'}>
                          {lesson.progress}%
                        </span>
                        {lesson.isComplete ? (
                          <span className="text-dark-900 font-light">Complete</span>
                        ) : lesson.progress > 0 ? (
                          <span className="text-dark-400 font-light">In progress</span>
                        ) : (
                          <span className="text-dark-900 font-light">Start →</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Locked message */}
                  {!lesson.isUnlocked && (
                    <div className="mt-4 text-xs text-dark-400 font-light">
                      Complete Level {lesson.level - 1} to unlock
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
        {selectedJlpt === null && !showAllLevels && lessons.length > 15 && (
          <div className="text-center mt-6">
            <Button variant="secondary" onClick={() => setShowAllLevels(true)}>
              View All {lessons.length} Levels
            </Button>
          </div>
        )}
        {showAllLevels && selectedJlpt === null && (
          <div className="text-center mt-6">
            <Button variant="secondary" onClick={() => setShowAllLevels(false)}>
              Show Less
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
