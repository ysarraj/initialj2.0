'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/src/components/ui/Card';
import { getWeekEnd } from '@/src/lib/weekly-xp';

interface LeaderboardEntry {
  userId: string;
  username: string;
  email: string;
  xp: number;
  rank?: number;
}

interface LeaderboardData {
  top10: LeaderboardEntry[];
  currentUser: LeaderboardEntry | null;
  userContext: LeaderboardEntry[] | null;
  totalUsers: number;
  weekStart?: string;
  weekEnd?: string;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Calculate time remaining until week end
  useEffect(() => {
    const updateTimeRemaining = () => {
      const weekEnd = getWeekEnd();
      const now = new Date();
      const diff = weekEnd.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Week ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/api/leaderboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch leaderboard');
        }

        const leaderboardData = await res.json();
        setData(leaderboardData);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [router]);

  const formatXP = (xp: number): string => {
    return new Intl.NumberFormat('en-US').format(xp);
  };

  const getRankEmoji = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-900" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="text-center p-8">
        <p className="text-dark-600">Failed to load leaderboard</p>
      </Card>
    );
  }

  return (
    <section className="py-24 lg:py-32">
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-light text-dark-900 mb-4">
            Leaderboard
          </h1>
          <p className="text-lg text-dark-600 font-light">
            Top learners ranked by weekly XP points
          </p>
        </div>

        {/* Week Info */}
        {data.weekStart && data.weekEnd && (
          <Card className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-light text-dark-900 mb-2">This Week's Leaderboard</h2>
                <p className="text-dark-600 font-light">
                  Week of {new Date(data.weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(data.weekEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </p>
                <p className="text-sm text-dark-500 font-light mt-2">
                  Leaderboard resets every Monday at midnight
                </p>
              </div>
              {timeRemaining && (
                <div className="flex flex-col items-center sm:items-end">
                  <p className="text-xs text-dark-500 font-light uppercase tracking-wide mb-1">
                    Time Remaining
                  </p>
                  <div className="text-2xl font-light text-dark-900 bg-dark-50 px-4 py-2 rounded-lg border border-dark-200">
                    {timeRemaining}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Top Users */}
        <Card className="mb-12">
          <h2 className="text-2xl font-light text-dark-900 mb-6">
            {data.top10.length < 10 ? 'Active Users This Week' : 'Top 10'}
          </h2>
          <div className="space-y-3">
            {data.top10.map((user, index) => (
              <div
                key={user.userId}
                className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 hover:bg-dark-50 ${
                  index < 3 ? 'bg-dark-50' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-light text-dark-900 w-12 text-center">
                    {getRankEmoji(user.rank || index + 1)}
                  </div>
                  <div>
                    <div className="font-light text-dark-900">
                      {user.username}
                    </div>
                    <div className="text-sm text-dark-500 font-light">
                      {formatXP(user.xp)} XP
                    </div>
                  </div>
                </div>
                {index < 3 && (
                  <div className="text-sm text-dark-400 font-light uppercase tracking-wide">
                    Top {index + 1}
                  </div>
                )}
              </div>
            ))}
            {data.top10.length === 0 && (
              <div className="text-center py-8 text-dark-500 font-light">
                No active users this week yet. Be the first to earn XP!
              </div>
            )}
          </div>
        </Card>

        {/* Current User Rank */}
        {data.currentUser && (
          <Card className="mb-12 border-2 border-dark-900">
            <h2 className="text-2xl font-light text-dark-900 mb-6">Your Rank</h2>
            <div className="flex items-center justify-between p-6 bg-dark-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-light text-dark-900 w-16 text-center">
                  {data.currentUser.rank ? getRankEmoji(data.currentUser.rank) : '—'}
                </div>
                <div>
                  <div className="font-light text-dark-900 text-xl">
                    {data.currentUser.username}
                  </div>
                  <div className="text-lg text-dark-600 font-light">
                    {formatXP(data.currentUser.xp)} XP
                  </div>
                </div>
              </div>
              {data.currentUser.rank && (
                <div className="text-sm text-dark-500 font-light">
                  Rank {data.currentUser.rank} of {data.totalUsers}
                </div>
              )}
            </div>

            {/* User Context (if not in top users list) */}
            {data.userContext && data.userContext.length > 0 && data.currentUser.rank && data.currentUser.rank > data.top10.length && (
              <div className="mt-6 pt-6 border-t border-dark-200">
                <h3 className="text-lg font-light text-dark-900 mb-4">Nearby Rankings</h3>
                <div className="space-y-2">
                  {data.userContext.map((user) => {
                    const isCurrentUser = user.userId === data.currentUser?.userId;
                    
                    return (
                      <div
                        key={user.userId}
                        className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                          isCurrentUser ? 'bg-dark-900 text-white' : 'bg-white hover:bg-dark-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`font-light w-8 text-center ${
                            isCurrentUser ? 'text-white' : 'text-dark-900'
                          }`}>
                            {user.rank ? `${user.rank}.` : '—'}
                          </div>
                          <div className={`font-light ${
                            isCurrentUser ? 'text-white' : 'text-dark-900'
                          }`}>
                            {user.username}
                          </div>
                        </div>
                        <div className={`font-light ${
                          isCurrentUser ? 'text-white' : 'text-dark-600'
                        }`}>
                          {formatXP(user.xp)} XP
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* XP Info */}
        <Card>
          <h2 className="text-xl font-light text-dark-900 mb-4">How XP Works</h2>
          <div className="space-y-2 text-dark-600 font-light">
            <div>• Learn an item (kanji or vocabulary): <strong className="text-dark-900">10 XP</strong></div>
            <div>• Correct review: <strong className="text-dark-900">10 XP</strong></div>
            <div>• Burn an item (kanji or vocabulary): <strong className="text-dark-900">50 bonus XP</strong></div>
            <div className="mt-4 pt-4 border-t border-dark-200">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎉</span>
                <div>
                  <div><strong className="text-dark-900">Sunday = Double XP Day!</strong></div>
                  <div className="text-sm text-dark-500">All XP earned on Sundays is doubled</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>
  );
}
