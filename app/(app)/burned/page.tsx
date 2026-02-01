'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';

interface BurnedItem {
  type: 'kanji' | 'vocab';
  id: string;
  character: string;
  meanings: string[];
  primaryMeaning: string;
  kunYomi?: string[];
  onYomi?: string[];
  reading?: string;
  burnedAt: string | null;
  meaningCorrect: number;
  meaningIncorrect: number;
  readingCorrect: number;
  readingIncorrect: number;
}

interface BurnedData {
  items: BurnedItem[];
  counts: {
    kanji: number;
    vocab: number;
    total: number;
  };
}

export default function BurnedPage() {
  const router = useRouter();

  const [data, setData] = useState<BurnedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'kanji' | 'vocab'>('all');
  const [unburning, setUnburning] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<BurnedItem | null>(null);

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  };

  const fetchData = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/burned', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch burned items');

      const burnedData = await res.json();
      setData(burnedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const unburnItem = async (item: BurnedItem) => {
    const token = getAuthToken();
    if (!token) return;

    setUnburning(item.id);
    try {
      const res = await fetch('/api/burned', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: item.id, type: item.type }),
      });

      if (!res.ok) throw new Error('Failed to unburn item');

      // Refresh data
      await fetchData();
      setSelectedItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unburn');
    } finally {
      setUnburning(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getAccuracy = (item: BurnedItem) => {
    const correct = item.meaningCorrect + item.readingCorrect;
    const total = correct + item.meaningIncorrect + item.readingIncorrect;
    if (total === 0) return 100;
    return Math.round((correct / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
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

  const filteredItems = data?.items.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>Burned Items</span>
          <span className="text-amber-500">🔥</span>
        </h1>
        <p className="text-gray-600 text-sm">Items you've mastered. Unburn to review again.</p>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <div className="text-3xl font-bold text-amber-500">{data.counts.total}</div>
            <div className="text-sm text-gray-600">Total Burned</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-pink-500">{data.counts.kanji}</div>
            <div className="text-sm text-gray-600">Kanji</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-purple-500">{data.counts.vocab}</div>
            <div className="text-sm text-gray-600">Vocabulary</div>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'kanji', 'vocab'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm rounded-full transition-colors ${
              filter === f
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : f === 'kanji' ? 'Kanji' : 'Vocabulary'}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🔥</div>
          <h2 className="text-xl font-semibold mb-2">No Burned Items Yet</h2>
          <p className="text-gray-600 mb-6">
            Complete reviews to burn items, or press B during lessons to instantly burn items you already know.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Start Learning
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {filteredItems.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => setSelectedItem(item)}
              className={`aspect-square flex items-center justify-center rounded-xl text-2xl font-japanese transition-all hover:scale-105 ${
                item.type === 'kanji'
                  ? 'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-800 hover:from-amber-200 hover:to-orange-200'
                  : 'bg-gradient-to-br from-amber-50 to-yellow-100 text-amber-700 hover:from-amber-100 hover:to-yellow-200'
              }`}
            >
              {item.character}
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Card className="max-w-md w-full p-6">
              {/* Character */}
              <div className="text-center mb-4">
                <div className="text-6xl font-japanese mb-2">
                  {selectedItem.character}
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  selectedItem.type === 'kanji'
                    ? 'bg-pink-100 text-pink-700'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {selectedItem.type === 'kanji' ? 'Kanji' : 'Vocabulary'}
                </span>
              </div>

              {/* Meaning */}
              <div className="text-center mb-4">
                <div className="text-xl font-semibold">
                  {selectedItem.primaryMeaning}
                </div>
                {selectedItem.meanings.length > 1 && (
                  <div className="text-sm text-gray-500 mt-1">
                    Also: {selectedItem.meanings
                      .filter(m => m !== selectedItem.primaryMeaning)
                      .slice(0, 4)
                      .join(', ')}
                  </div>
                )}
              </div>

              {/* Readings */}
              <div className="p-3 bg-gray-50 rounded-lg mb-4">
                {selectedItem.type === 'kanji' ? (
                  <div className="flex justify-center gap-6">
                    {selectedItem.onYomi && selectedItem.onYomi.length > 0 && (
                      <div className="text-center">
                        <div className="text-xs uppercase tracking-wider text-blue-500 mb-1">On'yomi</div>
                        <div className="font-japanese">{selectedItem.onYomi.join('、')}</div>
                      </div>
                    )}
                    {selectedItem.kunYomi && selectedItem.kunYomi.length > 0 && (
                      <div className="text-center">
                        <div className="text-xs uppercase tracking-wider text-orange-500 mb-1">Kun'yomi</div>
                        <div className="font-japanese">{selectedItem.kunYomi.join('、')}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-xs uppercase tracking-wider text-purple-500 mb-1">Reading</div>
                    <div className="font-japanese">{selectedItem.reading}</div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-600">{getAccuracy(selectedItem)}%</div>
                  <div className="text-xs text-green-600/70">Accuracy</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg text-center">
                  <div className="text-sm font-medium text-amber-700">{formatDate(selectedItem.burnedAt)}</div>
                  <div className="text-xs text-amber-600/70">Burned On</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedItem(null)}
                  fullWidth
                >
                  Close
                </Button>
                <Button
                  onClick={() => unburnItem(selectedItem)}
                  disabled={unburning === selectedItem.id}
                  fullWidth
                >
                  {unburning === selectedItem.id ? 'Unburning...' : 'Unburn'}
                </Button>
              </div>

              <div className="mt-3 text-xs text-center text-gray-400">
                Unburning resets to Apprentice 1 for review
              </div>
            </Card>
          </div>
        </div>
      )}

      <style jsx global>{`
        .font-japanese {
          font-family: "Hiragino Kaku Gothic Pro", "Meiryo", "MS Gothic", sans-serif;
        }
      `}</style>
    </div>
  );
}
