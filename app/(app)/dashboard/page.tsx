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
  0: 'bg-gray-400',
  1: 'bg-pink-400',
  2: 'bg-pink-500',
  3: 'bg-pink-600',
  4: 'bg-pink-700',
  5: 'bg-purple-500',
  6: 'bg-purple-600',
  7: 'bg-blue-500',
  8: 'bg-blue-600',
  9: 'bg-amber-500',
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="font-japanese">漢字</span> Kanji Learning
          </h1>
          <p className="text-gray-600 mt-1">Master Japanese kanji with spaced repetition</p>
        </div>
        {progress && progress.pendingReviews.total > 0 && (
          <Link href="/reviews">
            <Button size="lg">
              Start Reviews ({progress.pendingReviews.total})
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      {progress && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <div className="text-3xl font-bold text-gray-900">{progress.learned.kanji}</div>
            <div className="text-sm text-gray-600">Kanji Learned</div>
            <div className="text-xs text-gray-400 mt-1">of {progress.totals.kanji}</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-gray-900">{progress.learned.vocab}</div>
            <div className="text-sm text-gray-600">Vocabulary</div>
            <div className="text-xs text-gray-400 mt-1">of {progress.totals.vocab}</div>
          </Card>
          <Link href="/burned" className="block">
            <Card className="text-center cursor-pointer hover:shadow-lg transition-shadow">
              <div className="text-3xl font-bold text-amber-500">{progress.burned.kanji + progress.burned.vocab}</div>
              <div className="text-sm text-gray-600">Burned 🔥</div>
              <div className="text-xs text-gray-400 mt-1">Click to manage</div>
            </Card>
          </Link>
          <Card className="text-center">
            <div className="text-3xl font-bold text-green-600">{progress.accuracy}%</div>
            <div className="text-sm text-gray-600">Accuracy</div>
            <div className="text-xs text-gray-400 mt-1">Overall score</div>
          </Card>
        </div>
      )}

      {/* Reviews Section */}
      {progress && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">Reviews</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <div className="text-4xl font-bold text-pink-600">{progress.pendingReviews.total}</div>
              <div className="text-sm text-pink-600/80 mt-1">Pending Reviews</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatNextReview(progress.nextReviewAt)}
              </div>
              <div className="text-sm text-blue-600/80 mt-1">Next Review</div>
            </div>
            <div className="flex items-center justify-center">
              {progress.pendingReviews.total > 0 ? (
                <Link href="/reviews" className="w-full">
                  <Button fullWidth>Start Reviews</Button>
                </Link>
              ) : (
                <div className="text-center text-gray-600">
                  <span className="text-2xl">🎉</span>
                  <p className="mt-2">All caught up!</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* SRS Stage Distribution */}
      {progress && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">SRS Progress</h2>
          <div className="space-y-3">
            {progress.stageData.filter(s => s.stage > 0).map((stage) => {
              const total = stage.kanji + stage.vocab;
              const maxTotal = Math.max(...progress.stageData.map(s => s.kanji + s.vocab), 1);
              const width = (total / maxTotal) * 100;

              return (
                <div key={stage.stage} className="flex items-center gap-3">
                  <div className="w-28 text-sm text-gray-600">{stage.name}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${STAGE_COLORS[stage.stage]} transition-all duration-500`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <div className="w-16 text-sm text-right text-gray-500">{total}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Levels */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Levels</h2>
          {/* JLPT Filter */}
          <div className="flex gap-2">
            {[null, 5, 4, 3, 2, 1].map((jlpt) => (
              <button
                key={jlpt ?? 'all'}
                onClick={() => setSelectedJlpt(jlpt)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedJlpt === jlpt
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

              // Check if locked due to subscription
              const lockedBySubscription = !lesson.isAccessible && lesson.level > 10;

              return (
                <div
                  key={lesson.id}
                  className={`relative p-4 transition-all rounded-xl border-2 ${
                    lockedBySubscription
                      ? 'bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200 cursor-pointer hover:shadow-lg'
                      : !lesson.isUnlocked
                      ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
                      : lesson.isComplete
                      ? 'bg-green-50 border-green-300 cursor-pointer hover:shadow-lg'
                      : isCurrentLevel
                      ? 'bg-gradient-to-br from-pink-50 to-purple-50 border-pink-400 cursor-pointer hover:shadow-lg ring-2 ring-pink-400 ring-offset-2'
                      : 'bg-white border-gray-200 cursor-pointer hover:shadow-lg'
                  }`}
                  onClick={() => {
                    if (lockedBySubscription) {
                      router.push('/pricing');
                    } else if (lesson.isUnlocked) {
                      router.push(`/lessons/${lesson.id}`);
                    }
                  }}
                >
                  {isCurrentLevel && !lockedBySubscription && (
                    <div className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full font-medium animate-pulse">
                      Current
                    </div>
                  )}

                  {lockedBySubscription && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                      Pro
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${
                        lesson.isComplete ? 'text-green-500' :
                        lesson.isUnlocked && !lockedBySubscription ? 'text-pink-500' : 'text-gray-400'
                      }`}>
                        {lesson.level}
                      </span>
                      {lesson.isComplete && <span className="text-green-500">✓</span>}
                    </div>
                    {(!lesson.isUnlocked || lockedBySubscription) && (
                      <span className="text-lg">🔒</span>
                    )}
                  </div>

                  <h3 className={`font-semibold mb-1 ${
                    !lesson.isUnlocked || lockedBySubscription ? 'text-gray-500' : 'text-gray-900'
                  }`}>
                    {lesson.title.split(' - ')[0]}
                  </h3>

                  <div className={`flex gap-3 text-xs ${
                    !lesson.isUnlocked || lockedBySubscription ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <span>{lesson.kanjiCount} kanji</span>
                    <span>{lesson.vocabCount} vocab</span>
                  </div>

                  {/* Progress bar for accessible unlocked lessons */}
                  {lesson.isUnlocked && !lockedBySubscription && (
                    <div className="mt-3">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            lesson.isComplete
                              ? 'bg-green-500'
                              : 'bg-gradient-to-r from-pink-500 to-purple-500'
                          }`}
                          style={{ width: `${lesson.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className={lesson.isComplete ? 'text-green-600' : 'text-gray-400'}>
                          {lesson.progress}%
                        </span>
                        {lesson.isComplete ? (
                          <span className="text-green-600 font-medium">Complete!</span>
                        ) : lesson.progress > 0 ? (
                          <span className="text-gray-400">In progress</span>
                        ) : (
                          <span className="text-pink-500 font-medium">Start →</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Locked message */}
                  {!lesson.isUnlocked && !lockedBySubscription && (
                    <div className="mt-3 text-xs text-gray-400">
                      Complete Level {lesson.level - 1} to unlock
                    </div>
                  )}

                  {lockedBySubscription && (
                    <div className="mt-3 text-xs text-pink-600 font-medium">
                      Upgrade to access →
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
