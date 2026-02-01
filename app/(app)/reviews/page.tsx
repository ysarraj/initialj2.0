'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';

interface ReviewItem {
  id: string;
  type: 'kanji' | 'vocabulary';
  itemId: string;
  character: string;
  meanings: string[];
  primaryMeaning: string;
  readings: {
    kun?: string[];
    on?: string[];
    reading?: string;
  };
  srsStage: number;
  srsName: string;
}

type QuestionType = 'meaning' | 'reading';

interface ReviewState {
  item: ReviewItem;
  questionType: QuestionType;
  userAnswer: string;
  isCorrect: boolean | null;
  showResult: boolean;
  shake: boolean;
  showHint: boolean;
  usedHint: boolean;
}

interface ReviewQuestion {
  item: ReviewItem;
  questionType: QuestionType;
}

// Romaji to Hiragana conversion
const ROMAJI_TO_HIRAGANA: Record<string, string> = {
  'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
  'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
  'sa': 'さ', 'si': 'し', 'shi': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
  'ta': 'た', 'ti': 'ち', 'chi': 'ち', 'tu': 'つ', 'tsu': 'つ', 'te': 'て', 'to': 'と',
  'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
  'ha': 'は', 'hi': 'ひ', 'hu': 'ふ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
  'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
  'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
  'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
  'wa': 'わ', 'wo': 'を', 'nn': 'ん',
  'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
  'za': 'ざ', 'zi': 'じ', 'ji': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
  'da': 'だ', 'du': 'づ', 'de': 'で', 'do': 'ど',
  'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
  'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
  'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
  'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
  'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
  'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
  'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
  'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
  'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
  'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
  'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
  'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
  'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
  '-': 'ー',
};

function romajiToHiragana(input: string): string {
  let result = '';
  let i = 0;
  const lower = input.toLowerCase();

  while (i < lower.length) {
    let found = false;

    if (i < lower.length - 1 && lower[i] === lower[i + 1] && 'kstpgdbzcjfhmr'.includes(lower[i])) {
      result += 'っ';
      i++;
      continue;
    }

    for (let len = Math.min(4, lower.length - i); len > 0; len--) {
      const substr = lower.substring(i, i + len);
      if (ROMAJI_TO_HIRAGANA[substr]) {
        result += ROMAJI_TO_HIRAGANA[substr];
        i += len;
        found = true;
        break;
      }
    }

    if (!found && lower[i] === 'n') {
      const next = lower[i + 1];
      const nCombos = ['na', 'ni', 'nu', 'ne', 'no', 'ny'];
      const isNComboPossible = next && nCombos.some(c => c.startsWith('n' + next));

      if (next === 'n') {
        result += 'ん';
        i += 2;
        found = true;
      } else if (next && !isNComboPossible && !'aiueoy'.includes(next)) {
        result += 'ん';
        i++;
        found = true;
      }
    }

    if (!found) {
      result += lower[i];
      i++;
    }
  }

  return result;
}

function containsKanji(str: string): boolean {
  return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(str);
}

function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) - 0x60);
  });
}

const ITEMS_PER_SESSION = 20;

export default function ReviewsPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewState, setReviewState] = useState<ReviewState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0, total: 0 });
  const [completed, setCompleted] = useState(false);
  const [rawInput, setRawInput] = useState('');

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  };

  useEffect(() => {
    const fetchReviews = async () => {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/api/reviews?limit=100', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch reviews');

        const data = await res.json();

        if (data.reviews.length === 0) {
          setCompleted(true);
        } else {
          const sortedByPriority = [...data.reviews].sort((a: ReviewItem, b: ReviewItem) => a.srsStage - b.srsStage);
          const sessionItems = sortedByPriority.slice(0, ITEMS_PER_SESSION);

          const expandedReviews: ReviewQuestion[] = [];
          sessionItems.forEach((item: ReviewItem) => {
            const isVocab = item.type === 'vocabulary';
            const isKanaOnly = isVocab && !containsKanji(item.character);

            if (isKanaOnly) {
              expandedReviews.push({ item, questionType: 'meaning' });
            } else {
              const meaningFirst = Math.random() < 0.5;
              if (meaningFirst) {
                expandedReviews.push({ item, questionType: 'meaning' });
                expandedReviews.push({ item, questionType: 'reading' });
              } else {
                expandedReviews.push({ item, questionType: 'reading' });
                expandedReviews.push({ item, questionType: 'meaning' });
              }
            }
          });

          const shuffled = [...expandedReviews];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }

          setQuestions(shuffled);
          setStats({ correct: 0, incorrect: 0, total: shuffled.length });

          if (shuffled.length > 0) {
            setReviewState({
              item: shuffled[0].item,
              questionType: shuffled[0].questionType,
              userAnswer: '',
              isCorrect: null,
              showResult: false,
              shake: false,
              showHint: false,
              usedHint: false,
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [router]);

  useEffect(() => {
    if (inputRef.current && !reviewState?.showResult) {
      inputRef.current.focus();
    }
  }, [reviewState?.showResult, currentIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!reviewState || reviewState.showResult) return;

    const value = e.target.value;
    setRawInput(value);

    if (reviewState.questionType === 'reading') {
      const converted = romajiToHiragana(value);
      setReviewState({ ...reviewState, userAnswer: converted });
    } else {
      setReviewState({ ...reviewState, userAnswer: value });
    }
  };

  const toggleHint = useCallback(() => {
    if (!reviewState || reviewState.showResult) return;
    setReviewState({
      ...reviewState,
      showHint: !reviewState.showHint,
      usedHint: true,
    });
  }, [reviewState]);

  const revealAnswer = useCallback(() => {
    if (!reviewState || reviewState.showResult) return;
    setReviewState({
      ...reviewState,
      isCorrect: false,
      showResult: true,
      showHint: false,
      usedHint: true,
    });
  }, [reviewState]);

  const burnItem = useCallback(async () => {
    if (!reviewState) return;

    const token = getAuthToken();
    if (!token) return;

    try {
      await fetch('/api/burned', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: reviewState.item.itemId,
          type: reviewState.item.type === 'kanji' ? 'kanji' : 'vocab',
        }),
      });

      setStats(prev => ({ ...prev, correct: prev.correct + 1 }));

      let nextIdx = currentIndex + 1;
      while (nextIdx < questions.length && questions[nextIdx].item.id === reviewState.item.id) {
        setStats(prev => ({ ...prev, correct: prev.correct + 1 }));
        nextIdx++;
      }

      if (nextIdx >= questions.length) {
        setCompleted(true);
      } else {
        const nextQuestion = questions[nextIdx];
        setCurrentIndex(nextIdx);
        setRawInput('');
        setReviewState({
          item: nextQuestion.item,
          questionType: nextQuestion.questionType,
          userAnswer: '',
          isCorrect: null,
          showResult: false,
          shake: false,
          showHint: false,
          usedHint: false,
        });
      }
    } catch (err) {
      console.error('Failed to burn item:', err);
    }
  }, [reviewState, currentIndex, questions]);

  const checkAnswer = useCallback(() => {
    if (!reviewState || reviewState.showResult) return;

    const { item, questionType, userAnswer } = reviewState;
    const answer = userAnswer.toLowerCase().trim();

    if (!answer) return;

    let isCorrect = false;

    if (questionType === 'meaning') {
      const normalizedAnswer = answer.replace(/[^a-z]/g, '');
      isCorrect = item.meanings.some(m => {
        const normalizedMeaning = m.toLowerCase().replace(/[^a-z]/g, '');
        return normalizedMeaning === normalizedAnswer ||
               normalizedMeaning.includes(normalizedAnswer) ||
               normalizedAnswer.includes(normalizedMeaning);
      });
    } else {
      const cleanAnswer = answer.replace(/[.\s\-～〜]/g, '');
      if (item.type === 'kanji') {
        const allReadings = [...(item.readings.kun || []), ...(item.readings.on || [])];
        isCorrect = allReadings.some(r => {
          const cleanReading = r.replace(/[.\s\-～〜]/g, '').toLowerCase();
          const hiraganaReading = katakanaToHiragana(cleanReading);
          return cleanReading === cleanAnswer || hiraganaReading === cleanAnswer;
        });
      } else {
        const cleanReading = (item.readings.reading || '').replace(/[.\s\-～〜]/g, '').toLowerCase();
        const hiraganaReading = katakanaToHiragana(cleanReading);
        isCorrect = cleanReading === cleanAnswer || hiraganaReading === cleanAnswer;
      }
    }

    if (isCorrect) {
      setReviewState(prev => prev ? { ...prev, isCorrect: true, showResult: true, shake: false } : null);
    } else {
      setReviewState({ ...reviewState, shake: true });
      setTimeout(() => {
        setReviewState(prev => prev ? { ...prev, shake: false, userAnswer: '' } : null);
        setRawInput('');
      }, 500);
    }
  }, [reviewState]);

  const submitAndNext = useCallback(async () => {
    if (!reviewState) return;

    const token = getAuthToken();
    if (!token) return;

    setSubmitting(true);

    const effectiveCorrect = reviewState.isCorrect && !reviewState.usedHint;

    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progressId: reviewState.item.id,
          type: reviewState.item.type,
          questionType: reviewState.questionType,
          correct: effectiveCorrect,
        }),
      });

      setStats(prev => ({
        ...prev,
        correct: prev.correct + (reviewState.isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (reviewState.isCorrect ? 0 : 1),
      }));

      const nextIndex = currentIndex + 1;

      if (nextIndex >= questions.length) {
        setCompleted(true);
      } else {
        const nextQuestion = questions[nextIndex];
        setCurrentIndex(nextIndex);
        setRawInput('');
        setReviewState({
          item: nextQuestion.item,
          questionType: nextQuestion.questionType,
          userAnswer: '',
          isCorrect: null,
          showResult: false,
          shake: false,
          showHint: false,
          usedHint: false,
        });
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmitting(false);
    }
  }, [reviewState, currentIndex, questions]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (completed) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          router.push('/dashboard');
        }
        return;
      }

      if (reviewState?.showResult) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          void submitAndNext();
        } else if (e.key === '3') {
          e.preventDefault();
          void burnItem();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          router.push('/dashboard');
        }
        return;
      }

      if (e.target instanceof HTMLInputElement) {
        if (e.key === 'Enter') {
          e.preventDefault();
          checkAnswer();
        } else if (e.key === '1') {
          e.preventDefault();
          toggleHint();
        } else if (e.key === '2') {
          e.preventDefault();
          revealAnswer();
        } else if (e.key === '3') {
          e.preventDefault();
          void burnItem();
        }
        return;
      }

      switch (e.key) {
        case '1':
          e.preventDefault();
          toggleHint();
          break;
        case '2':
          e.preventDefault();
          revealAnswer();
          break;
        case '3':
          e.preventDefault();
          void burnItem();
          break;
        case 'Escape':
          e.preventDefault();
          router.push('/dashboard');
          break;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [completed, reviewState, router, submitAndNext, checkAnswer, toggleHint, revealAnswer, burnItem]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    );
  }

  if (completed) {
    const accuracy = stats.correct + stats.incorrect > 0
      ? Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100)
      : 100;

    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold mb-2">Reviews Complete!</h1>
        <p className="text-gray-600 mb-8">Great job studying today</p>

        <Card className="mb-8">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-3xl font-bold text-green-600">{stats.correct}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-500">{stats.incorrect}</div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{accuracy}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
          </div>
        </Card>

        <Button onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!reviewState) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No reviews available</p>
        <Button onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const { item, questionType, userAnswer, isCorrect, showResult, shake } = reviewState;

  const getInputClassName = () => {
    const base = 'w-full px-4 py-3 text-xl text-center rounded-none focus:outline-none transition-all';

    if (showResult) {
      return `${base} ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`;
    }

    if (questionType === 'meaning') {
      return `${base} bg-gray-100 text-gray-900 focus:bg-gray-200`;
    }

    return `${base} bg-gray-900 text-white placeholder-gray-500`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard')}>
          ← Exit
        </Button>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-gray-600">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <div className="flex justify-center gap-6 text-sm">
        <span className="text-green-600">✓ {stats.correct}</span>
        <span className="text-red-500">✗ {stats.incorrect}</span>
        <span className="text-gray-500">Remaining: {questions.length - currentIndex - 1}</span>
      </div>

      <Card padding="none" className={`overflow-hidden transition-all ${shake ? 'animate-shake' : ''}`}>
        <div className={`py-2 text-center text-white text-sm font-medium ${
          questionType === 'meaning' ? 'bg-slate-600' : 'bg-slate-800'
        }`}>
          {item.type === 'kanji' ? 'Kanji' : 'Vocabulary'} · {questionType === 'meaning' ? 'Meaning' : 'Reading'}
        </div>

        <div className="p-8">
          <div className="text-center">
            <div className={`mb-6 font-japanese ${item.type === 'kanji' ? 'text-9xl' : 'text-6xl'}`}>
              {item.character}
            </div>

            {reviewState.showHint && !showResult && (
              <div className="mb-4 p-3 bg-blue-50 rounded-xl max-w-md mx-auto animate-fadeIn">
                {questionType === 'meaning' ? (
                  item.type === 'kanji' ? (
                    <div className="flex justify-center gap-6">
                      {item.readings.on && item.readings.on.length > 0 && (
                        <div className="text-center">
                          <div className="text-[10px] uppercase tracking-wider text-blue-500 mb-1">On</div>
                          <div className="text-lg font-japanese">{item.readings.on.join('、')}</div>
                        </div>
                      )}
                      {item.readings.kun && item.readings.kun.length > 0 && (
                        <div className="text-center">
                          <div className="text-[10px] uppercase tracking-wider text-orange-500 mb-1">Kun</div>
                          <div className="text-lg font-japanese">{item.readings.kun.join('、')}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-[10px] uppercase tracking-wider text-purple-500 mb-1">Reading</div>
                      <div className="text-lg font-japanese">{item.readings.reading}</div>
                    </div>
                  )
                ) : (
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-wider text-green-600 mb-1">Meaning</div>
                    <div className="text-lg">{item.primaryMeaning}</div>
                  </div>
                )}
                <div className="text-[10px] text-center text-orange-500 mt-2">Using hint affects SRS</div>
              </div>
            )}

            <div className="max-w-md mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={questionType === 'reading' ? userAnswer : rawInput}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (showResult) {
                      void submitAndNext();
                    } else {
                      checkAnswer();
                    }
                  }
                }}
                placeholder={questionType === 'meaning' ? 'Your response' : 'Reading'}
                className={getInputClassName()}
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                disabled={showResult}
              />

              {questionType === 'reading' && !showResult && rawInput && (
                <div className="text-xs text-gray-400 mt-1">
                  {rawInput} → {userAnswer}
                </div>
              )}

              {!showResult && (
                <div className="mt-3 flex items-center justify-center gap-3">
                  <button
                    onClick={toggleHint}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                      reviewState.showHint ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    Hint (1)
                  </button>
                  <button
                    onClick={revealAnswer}
                    className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    Reveal (2)
                  </button>
                  <button
                    onClick={burnItem}
                    className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                  >
                    Burn (3)
                  </button>
                </div>
              )}
            </div>

            {showResult && (
              <div className="mt-6 space-y-4">
                <div className="text-left max-w-md mx-auto p-4 bg-gray-50 rounded-lg">
                  {questionType === 'meaning' ? (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Meaning</div>
                      <div className="text-xl font-semibold">{item.primaryMeaning}</div>
                      {item.meanings.length > 1 && (
                        <div className="text-sm text-gray-600 mt-1">
                          Also: {item.meanings.filter(m => m !== item.primaryMeaning).join(', ')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Reading</div>
                      {item.type === 'kanji' ? (
                        <div className="space-y-1">
                          {item.readings.kun && item.readings.kun.length > 0 && (
                            <div className="text-lg">
                              <span className="text-gray-500 text-sm">Kun: </span>
                              <span className="font-japanese">{item.readings.kun.join('、')}</span>
                            </div>
                          )}
                          {item.readings.on && item.readings.on.length > 0 && (
                            <div className="text-lg">
                              <span className="text-gray-500 text-sm">On: </span>
                              <span className="font-japanese">{item.readings.on.join('、')}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xl font-japanese">{item.readings.reading}</div>
                      )}
                    </div>
                  )}

                  {!isCorrect && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs uppercase tracking-wider text-red-500 mb-1">Your Answer</div>
                      <div className="text-gray-700">{userAnswer || '(empty)'}</div>
                    </div>
                  )}
                </div>

                <Button className="mt-4" onClick={submitAndNext} loading={submitting}>
                  {submitting ? 'Saving...' : 'Next →'}
                </Button>
              </div>
            )}

            {!showResult && (
              <div className="mt-4 text-xs text-gray-400">
                Press Enter to check your answer
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex justify-center gap-3 text-xs text-gray-400 flex-wrap">
        <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">Enter</kbd> submit/next</span>
        <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">1</kbd> hint</span>
        <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">2</kbd> reveal</span>
        <span><kbd className="px-1.5 py-0.5 bg-amber-100 rounded text-[10px]">3</kbd> burn</span>
        <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">Esc</kbd> exit</span>
      </div>
    </div>
  );
}
