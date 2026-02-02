'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';

interface KanjiItem {
  id: string;
  character: string;
  meanings: string[];
  primaryMeaning: string;
  kunYomi: string[];
  onYomi: string[];
  grade: number | null;
  jlpt: number | null;
  strokeCount: number | null;
  meaningMnemonic: string | null;
  readingMnemonic: string | null;
  progress: { srsStage: number } | null;
  relatedVocab: { id: string; word: string; reading: string; primaryMeaning: string }[];
}

interface VocabItem {
  id: string;
  word: string;
  reading: string;
  meanings: string[];
  primaryMeaning: string;
  partOfSpeech: string | null;
  progress: { srsStage: number } | null;
}

interface LessonData {
  lesson: { id: string; level: number; title: string; description: string; lessonType: 'HIRAGANA' | 'KATAKANA' | 'KANJI' };
  kanji: KanjiItem[];
  vocabulary: VocabItem[];
}

type StudyItem = (KanjiItem & { type: 'kanji' }) | (VocabItem & { type: 'vocab' });
type StudyMode = 'overview' | 'lesson' | 'complete';
type QuestionType = 'meaning' | 'reading';

interface StudyQuestion {
  item: StudyItem;
  questionType: QuestionType;
}

const ITEMS_PER_LESSON = 10;

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

const COMPLETION_MESSAGES = [
  { emoji: '🔥', text: "You're on fire!" },
  { emoji: '⭐', text: 'Star student!' },
  { emoji: '🚀', text: 'Blasting off!' },
  { emoji: '💪', text: 'Getting stronger!' },
  { emoji: '🧠', text: 'Big brain energy!' },
  { emoji: '✨', text: 'Brilliant work!' },
];

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params?.id as string;

  const [data, setData] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>('overview');
  const [currentBatch, setCurrentBatch] = useState<StudyItem[]>([]);
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [showReading, setShowReading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completionMessage, setCompletionMessage] = useState({ emoji: '🎉', text: 'Great job!' });
  const [userAnswer, setUserAnswer] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [answerState, setAnswerState] = useState<'pending' | 'correct' | 'incorrect'>('pending');
  const [shake, setShake] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [firstAttemptSuccess, setFirstAttemptSuccess] = useState<Set<string>>(new Set());
  const [usedHelpForItem, setUsedHelpForItem] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  };

  const progress = useMemo(() => {
    if (!data) return { learned: 0, total: 0, percent: 0, kanjiLearned: 0, kanjiTotal: 0, vocabLearned: 0, vocabTotal: 0 };
    const learnedKanji = data.kanji.filter(k => k.progress).length;
    const learnedVocab = data.vocabulary.filter(v => v.progress).length;
    const total = data.kanji.length + data.vocabulary.length;
    const learned = learnedKanji + learnedVocab;
    return {
      learned,
      total,
      percent: total > 0 ? Math.round((learned / total) * 100) : 0,
      kanjiLearned: learnedKanji,
      kanjiTotal: data.kanji.length,
      vocabLearned: learnedVocab,
      vocabTotal: data.vocabulary.length,
    };
  }, [data]);

  const getNextBatch = useCallback((): { items: StudyItem[]; questions: StudyQuestion[] } => {
    if (!data) return { items: [], questions: [] };

    const lessonKanjiChars = new Set(data.kanji.map(k => k.character));
    const learnedKanjiChars = new Set(data.kanji.filter(k => k.progress).map(k => k.character));

    const unlearnedKanji: StudyItem[] = data.kanji
      .filter(k => !k.progress)
      .map(k => ({ ...k, type: 'kanji' as const }));

    const eligibleVocab: StudyItem[] = data.vocabulary
      .filter(v => {
        if (v.progress) return false;
        const wordKanji = v.word.split('').filter(char => containsKanji(char));
        if (wordKanji.length === 0) return true;
        return wordKanji.every(k => !lessonKanjiChars.has(k) || learnedKanjiChars.has(k));
      })
      .map(v => ({ ...v, type: 'vocab' as const }));

    const items: StudyItem[] = [];
    const shuffledKanji = [...unlearnedKanji].sort(() => Math.random() - 0.5);
    items.push(...shuffledKanji.slice(0, ITEMS_PER_LESSON));

    if (items.length < ITEMS_PER_LESSON) {
      const shuffledVocab = [...eligibleVocab].sort(() => Math.random() - 0.5);
      items.push(...shuffledVocab.slice(0, ITEMS_PER_LESSON - items.length));
    }

    items.sort(() => Math.random() - 0.5);

    const questionsArr: StudyQuestion[] = [];
    const isKanaLesson = data.lesson.lessonType === 'HIRAGANA' || data.lesson.lessonType === 'KATAKANA';
    
    items.forEach(item => {
      const isVocab = item.type === 'vocab';
      const vocabWord = isVocab ? (item as VocabItem & { type: 'vocab' }).word : '';
      const isKanaOnly = isVocab && !containsKanji(vocabWord);

      // For hiragana/katakana lessons, only generate reading questions
      if (isKanaLesson) {
        questionsArr.push({ item, questionType: 'reading' });
      } else if (isKanaOnly) {
        questionsArr.push({ item, questionType: 'meaning' });
      } else {
        const meaningFirst = Math.random() < 0.5;
        if (meaningFirst) {
          questionsArr.push({ item, questionType: 'meaning' });
          questionsArr.push({ item, questionType: 'reading' });
        } else {
          questionsArr.push({ item, questionType: 'reading' });
          questionsArr.push({ item, questionType: 'meaning' });
        }
      }
    });

    for (let i = questionsArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questionsArr[i], questionsArr[j]] = [questionsArr[j], questionsArr[i]];
    }

    return { items, questions: questionsArr };
  }, [data]);

  useEffect(() => {
    const fetchLesson = async () => {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`/api/lessons/${lessonId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 402) {
            // In beta mode, all levels are accessible - redirect to dashboard
            router.push('/dashboard');
            return;
          }
          if (res.status === 403) {
            throw new Error('locked');
          }
          throw new Error('Failed to fetch lesson');
        }

        const lessonData = await res.json();
        setData(lessonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) fetchLesson();
  }, [lessonId, router]);

  const startLesson = async () => {
    const token = getAuthToken();
    if (!token) return;

    setStarting(true);
    try {
      await fetch(`/api/lessons/${lessonId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const refreshRes = await fetch(`/api/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const lessonData = await refreshRes.json();
      setData(lessonData);

      const { items, questions: questionsArr } = getNextBatch();
      if (items.length > 0) {
        setCurrentBatch(items);
        setQuestions(questionsArr);
        setCurrentIndex(0);
        setAnsweredQuestions(new Set());
        setStudyMode('lesson');
        setXpEarned(0);
        setStreak(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setStarting(false);
    }
  };

  const continueLesson = () => {
    const { items, questions: questionsArr } = getNextBatch();
    if (items.length > 0) {
      setCurrentBatch(items);
      setQuestions(questionsArr);
      setCurrentIndex(0);
      setAnsweredQuestions(new Set());
      setStudyMode('lesson');
      setShowMeaning(false);
      setShowReading(false);
      setXpEarned(0);
    } else {
      setStudyMode('complete');
    }
  };

  const checkAnswer = useCallback((answer: string, item: StudyItem, qType: QuestionType): boolean => {
    const userAns = answer.toLowerCase().trim();
    if (!userAns) return false;

    if (qType === 'meaning') {
      // Meaning questions don't exist for hiragana/katakana lessons
      if (data?.lesson.lessonType === 'HIRAGANA' || data?.lesson.lessonType === 'KATAKANA') {
        return false;
      }
      const meanings = item.type === 'kanji' ? (item as KanjiItem).meanings : (item as VocabItem).meanings;
      for (const meaning of meanings) {
        const correctAns = meaning.toLowerCase().trim();
        if (correctAns === userAns) return true;
        if (correctAns.includes(userAns) && userAns.length >= 3) return true;
        if (userAns.includes(correctAns) && correctAns.length >= 3) return true;
      }
      return false;
    } else {
      // For reading questions
      if (item.type === 'kanji') {
        const cleanAnswer = userAns.replace(/[.\s\-～〜]/g, '');
        const kanjiItem = item as KanjiItem;
        const allReadings = [...kanjiItem.kunYomi, ...kanjiItem.onYomi];
        return allReadings.some(r => {
          const cleanReading = r.replace(/[.\s\-～〜]/g, '').toLowerCase();
          const hiraganaReading = katakanaToHiragana(cleanReading);
          return cleanReading === cleanAnswer || hiraganaReading === cleanAnswer;
        });
      } else {
        // For vocab items (including hiragana/katakana)
        const vocabItem = item as VocabItem;
        const isKanaLesson = data?.lesson.lessonType === 'HIRAGANA' || data?.lesson.lessonType === 'KATAKANA';
        
        if (isKanaLesson) {
          // For kana lessons, reading field contains romaji, so compare romaji directly
          const cleanAnswer = userAns.toLowerCase().trim();
          const cleanReading = vocabItem.reading.toLowerCase().trim();
          return cleanReading === cleanAnswer;
        } else {
          // For regular vocab, compare kana readings
          const cleanAnswer = userAns.replace(/[.\s\-～〜]/g, '');
          const cleanReading = vocabItem.reading.replace(/[.\s\-～〜]/g, '').toLowerCase();
          const hiraganaReading = katakanaToHiragana(cleanReading);
          return cleanReading === cleanAnswer || hiraganaReading === cleanAnswer;
        }
      }
    }
  }, [data]);

  const submitAnswer = useCallback(() => {
    if (!questions[currentIndex]) return;

    const currentQuestion = questions[currentIndex];
    const item = currentQuestion.item;
    const questionType = currentQuestion.questionType;
    const isCorrect = checkAnswer(userAnswer, item, questionType);

    if (isCorrect) {
      setAnswerState('correct');
      setShowMeaning(true);
      setShowReading(true);
    } else {
      setUsedHelpForItem(prev => new Set(prev).add(item.id));
      setAnswerState('incorrect');
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setUserAnswer('');
        setRawInput('');
        setAnswerState('pending');
      }, 500);
    }
  }, [questions, currentIndex, userAnswer, checkAnswer]);

  const markItemStudied = useCallback(
    async (item: StudyItem, firstAttemptCorrect: boolean, questionCount: number) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [
            {
              id: item.id,
              type: item.type,
              firstAttemptCorrect,
              questionCount,
            },
          ],
        }),
      });

      const srsStage = firstAttemptCorrect ? 5 : 1;
      if (data) {
        const updatedData = { ...data };
        if (item.type === 'kanji') {
          updatedData.kanji = data.kanji.map(k =>
            k.id === item.id ? { ...k, progress: { srsStage } } : k
          );
        } else {
          updatedData.vocabulary = data.vocabulary.map(v =>
            v.id === item.id ? { ...v, progress: { srsStage } } : v
          );
        }
        setData(updatedData);
      }
    } catch (err) {
      console.error('Failed to mark item as studied:', err);
    }
    },
    [data]
  );

  const nextItem = useCallback(async () => {
    if (questions.length === 0) return;

    const currentQuestion = questions[currentIndex];
    const currentItem = currentQuestion.item;

    const questionKey = `${currentItem.id}-${currentQuestion.questionType}`;
    const newAnswered = new Set(answeredQuestions);
    newAnswered.add(questionKey);
    setAnsweredQuestions(newAnswered);

    const noHelpUsed = !usedHelpForItem.has(currentItem.id);
    const newFirstAttempt = new Set(firstAttemptSuccess);
    if (noHelpUsed) {
      newFirstAttempt.add(questionKey);
    }
    setFirstAttemptSuccess(newFirstAttempt);

    const meaningKey = `${currentItem.id}-meaning`;
    const readingKey = `${currentItem.id}-reading`;
    const hasReadingQuestion = questions.some(q => q.item.id === currentItem.id && q.questionType === 'reading');
    const hasMeaningQuestion = questions.some(q => q.item.id === currentItem.id && q.questionType === 'meaning');
    const isKanaLesson = data?.lesson.lessonType === 'HIRAGANA' || data?.lesson.lessonType === 'KATAKANA';
    
    // For kana lessons, only reading questions exist, so item is complete when reading is answered
    // For other lessons, check both meaning and reading if both exist
    const itemComplete = isKanaLesson
      ? newAnswered.has(readingKey)
      : hasReadingQuestion && hasMeaningQuestion
        ? (newAnswered.has(meaningKey) && newAnswered.has(readingKey))
        : newAnswered.has(meaningKey);

    if (itemComplete) {
      const allQuestionsFirstAttempt = isKanaLesson
        ? newFirstAttempt.has(readingKey)
        : hasReadingQuestion && hasMeaningQuestion
          ? (newFirstAttempt.has(meaningKey) && newFirstAttempt.has(readingKey))
          : newFirstAttempt.has(meaningKey);

      const questionCount = isKanaLesson ? 1 : (hasReadingQuestion && hasMeaningQuestion ? 2 : 1);
      await markItemStudied(currentItem, allQuestionsFirstAttempt, questionCount);
      setStreak(prev => prev + 1);

      // Always give XP for learning items - 10 XP per question answered
      setXpEarned(prev => prev + questionCount * 10);
    }
    setShowMeaning(false);
    setShowReading(false);
    setShowHint(false);
    setUserAnswer('');
    setRawInput('');
    setAnswerState('pending');

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setCompletionMessage(COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)]);
      setStudyMode('complete');
    }
  }, [currentIndex, questions, answeredQuestions, firstAttemptSuccess, usedHelpForItem, markItemStudied]);

  const toggleHint = useCallback(() => {
    if (questions[currentIndex]) {
      setUsedHelpForItem(prev => new Set(prev).add(questions[currentIndex].item.id));
    }
    setShowHint(prev => !prev);
  }, [questions, currentIndex]);

  const revealAnswer = useCallback(() => {
    if (questions[currentIndex]) {
      setUsedHelpForItem(prev => new Set(prev).add(questions[currentIndex].item.id));
    }
    setAnswerState('correct');
    setShowMeaning(true);
    setShowReading(true);
    setShowHint(false);
  }, [questions, currentIndex]);

  const burnItem = useCallback(async () => {
    if (!questions[currentIndex]) return;

    const item = questions[currentIndex].item;
    const token = getAuthToken();
    if (!token) return;

    try {
      await fetch('/api/burned', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: item.id, type: item.type }),
      });

      if (data) {
        const updatedData = { ...data };
        if (item.type === 'kanji') {
          updatedData.kanji = data.kanji.map(k =>
            k.id === item.id ? { ...k, progress: { srsStage: 9 } } : k
          );
        } else {
          updatedData.vocabulary = data.vocabulary.map(v =>
            v.id === item.id ? { ...v, progress: { srsStage: 9 } } : v
          );
        }
        setData(updatedData);
      }

      const newAnswered = new Set(answeredQuestions);
      newAnswered.add(`${item.id}-meaning`);
      newAnswered.add(`${item.id}-reading`);
      setAnsweredQuestions(newAnswered);

      // Don't give XP for manual burning - only real burning through reviews gives XP
      // setXpEarned(prev => prev + 15);
      setStreak(prev => prev + 1);

      let nextIdx = currentIndex + 1;
      while (nextIdx < questions.length && questions[nextIdx].item.id === item.id) {
        nextIdx++;
      }

      setShowMeaning(false);
      setShowReading(false);
      setShowHint(false);
      setUserAnswer('');
      setRawInput('');
      setAnswerState('pending');

      if (nextIdx < questions.length) {
        setCurrentIndex(nextIdx);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else {
        setCompletionMessage(COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)]);
        setStudyMode('complete');
      }
    } catch (err) {
      console.error('Failed to burn item:', err);
    }
  }, [questions, currentIndex, data, answeredQuestions]);

  // Keyboard shortcuts
  useEffect(() => {
    if (studyMode !== 'lesson') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (answerState === 'correct') {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
          e.preventDefault();
          void nextItem();
        } else if (e.key === '3') {
          e.preventDefault();
          void burnItem();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setStudyMode('overview');
        }
        return;
      }

      if (e.target instanceof HTMLInputElement) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitAnswer();
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
          setStudyMode('overview');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [studyMode, answerState, nextItem, submitAnswer, toggleHint, revealAnswer, burnItem]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    );
  }

  if (error || !data) {
    const isLocked = error?.includes('locked');
    return (
      <div className="max-w-md mx-auto text-center py-12">
        {isLocked ? (
          <>
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold mb-2">Level Locked</h2>
            <p className="text-gray-600 mb-6">Complete the previous level to unlock this one!</p>
          </>
        ) : (
          <p className="text-red-600 mb-4">{error || 'Level not found'}</p>
        )}
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  // Complete screen
  if (studyMode === 'complete') {
    const hasMore = progress.learned < progress.total;

    return (
      <div className="max-w-lg mx-auto text-center py-8">
        <div className="text-8xl mb-4 animate-bounce-sm">{completionMessage.emoji}</div>
        <h1 className="text-3xl font-bold mb-2">{completionMessage.text}</h1>
        <p className="text-gray-600 mb-6">Lesson complete!</p>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-bold text-lg mb-6 animate-pulse">
          +{xpEarned} XP
        </div>

        <Card className="mb-6">
          <div className="text-sm text-gray-600 mb-2">Level Progress</div>
          <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-1000"
              style={{ width: `${progress.percent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow">
              {progress.percent}%
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {progress.learned} / {progress.total} items learned
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="text-center">
            <div className="text-2xl font-bold text-pink-500">{currentBatch.length}</div>
            <div className="text-xs text-gray-600">Items studied</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-orange-500">{streak}</div>
            <div className="text-xs text-gray-600">Streak</div>
          </Card>
        </div>

        <div className="space-y-3">
          {hasMore ? (
            <Button size="lg" fullWidth onClick={continueLesson}>
              Continue Learning ({progress.total - progress.learned} left)
            </Button>
          ) : (
            <>
              <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-300">
                <div className="text-4xl mb-2">🏆</div>
                <div className="text-lg font-bold text-green-700">Level {data?.lesson.level} Complete!</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-sm text-purple-700">
                  🔓 Level {(data?.lesson.level || 0) + 1} is now unlocked!
                </div>
              </div>
            </>
          )}
          <Button variant="secondary" fullWidth onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Overview screen
  if (studyMode === 'overview') {
    const unlearnedCount = progress.total - progress.learned;
    const canStudy = unlearnedCount > 0;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard')}>
            ←
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">Level {data.lesson.level}</span>
              <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs font-medium rounded-full">
                {data.lesson.title.split(' - ')[0]}
              </span>
            </div>
          </div>
        </div>

        <Card className="p-8">
          <div className="flex flex-col items-center">
            <div className="relative w-48 h-48 mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                <circle
                  cx="96" cy="96" r="88" fill="none" stroke="url(#gradient)" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={`${progress.percent * 5.53} 553`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold">{progress.percent}%</div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 w-full max-w-xs">
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-500">
                  {progress.kanjiLearned}/{progress.kanjiTotal}
                </div>
                <div className="text-sm text-gray-600">Kanji</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500">
                  {progress.vocabLearned}/{progress.vocabTotal}
                </div>
                <div className="text-sm text-gray-600">Vocabulary</div>
              </div>
            </div>
          </div>
        </Card>

        {canStudy ? (
          <Button
            size="lg"
            fullWidth
            onClick={progress.learned === 0 ? startLesson : continueLesson}
            loading={starting}
            className="py-4 text-lg"
          >
            🎯 Start Lesson ({Math.min(unlearnedCount, ITEMS_PER_LESSON)} items)
          </Button>
        ) : (
          <Card className="p-6 bg-green-50 border-2 border-green-300 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-lg font-bold text-green-700">Level Mastered!</div>
            <div className="text-sm text-green-600">Come back for reviews to reinforce your memory</div>
          </Card>
        )}

        <Card>
          <div className="text-sm font-medium text-gray-600 mb-3">What you&apos;ll learn</div>
          <div className="flex flex-wrap gap-2">
            {data.kanji.slice(0, 15).map((k) => (
              <div
                key={k.id}
                className={`w-10 h-10 flex items-center justify-center text-lg rounded-lg transition-all ${
                  k.progress
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 border border-gray-200'
                }`}
              >
                {k.character}
              </div>
            ))}
            {data.kanji.length > 15 && (
              <div className="w-10 h-10 flex items-center justify-center text-xs text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                +{data.kanji.length - 15}
              </div>
            )}
          </div>
        </Card>

        <div className="text-center text-xs text-gray-400 space-y-1">
          <div>💡 Each lesson is just {ITEMS_PER_LESSON} items - quick and easy!</div>
          <div>⌨️ Type the meaning and press Enter. Use 1 to toggle reading.</div>
        </div>
      </div>
    );
  }

  // Lesson screen
  if (studyMode === 'lesson' && questions.length > 0) {
    const currentQuestion = questions[currentIndex];
    const currentItem = currentQuestion.item;
    const questionType = currentQuestion.questionType;
    const isKanji = currentItem.type === 'kanji';
    const kanjiItem = isKanji ? (currentItem as KanjiItem & { type: 'kanji' }) : null;
    const vocabItem = !isKanji ? (currentItem as VocabItem & { type: 'vocab' }) : null;
    const isKanaLesson = data?.lesson.lessonType === 'HIRAGANA' || data?.lesson.lessonType === 'KATAKANA';

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setStudyMode('overview')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            ✕
          </button>

          <div className="flex-1 flex items-center justify-center gap-1.5">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i < currentIndex ? 'w-2 bg-green-500' : i === currentIndex ? 'w-6 bg-gradient-to-r from-pink-500 to-purple-500' : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {xpEarned > 0 && (
            <div className="flex items-center gap-1 text-sm font-medium text-orange-500">
              <span>⚡</span>
              <span>{xpEarned}</span>
            </div>
          )}
        </div>

        <div
          className={`transition-all ${shake ? 'animate-shake' : ''} ${answerState === 'correct' ? 'cursor-pointer' : ''}`}
          onClick={() => answerState === 'correct' && void nextItem()}
        >
          <Card className={`p-6 min-h-[380px] flex flex-col ${answerState === 'correct' ? 'hover:shadow-lg' : ''}`}>
            <div className="text-center mb-2 flex items-center justify-center gap-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                isKanji ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {isKanji ? 'Kanji' : 'Vocabulary'}
              </span>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                questionType === 'meaning' ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-white'
              }`}>
                {questionType === 'meaning' ? 'Meaning' : 'Reading'}
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <div className={`font-japanese mb-4 ${isKanji ? 'text-[120px] leading-none' : 'text-6xl'}`}>
                {isKanji ? kanjiItem?.character : vocabItem?.word}
              </div>

                  {answerState === 'correct' ? (
                <div className="text-center animate-fadeIn w-full">
                  <div className="mb-4 text-green-500 font-medium">Correct!</div>
                  {/* For kana lessons, don't show meaning - only show romaji */}
                  {!(data?.lesson.lessonType === 'HIRAGANA' || data?.lesson.lessonType === 'KATAKANA') && (
                    <div className="text-3xl font-bold mb-2">
                      {isKanji ? kanjiItem?.primaryMeaning : vocabItem?.primaryMeaning}
                    </div>
                  )}

                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    {isKanji && kanjiItem ? (
                      <div className="flex justify-center gap-8">
                        {kanjiItem.onYomi.length > 0 && (
                          <div>
                            <div className="text-xs uppercase tracking-wider text-blue-500 mb-1 font-medium">On&apos;yomi</div>
                            <div className="text-2xl font-japanese">{kanjiItem.onYomi.join('、')}</div>
                          </div>
                        )}
                        {kanjiItem.kunYomi.length > 0 && (
                          <div>
                            <div className="text-xs uppercase tracking-wider text-orange-500 mb-1 font-medium">Kun&apos;yomi</div>
                            <div className="text-2xl font-japanese">{kanjiItem.kunYomi.join('、')}</div>
                          </div>
                        )}
                      </div>
                    ) : vocabItem ? (
                      <div>
                        <div className="text-xs uppercase tracking-wider text-purple-500 mb-1 font-medium">
                          {(data?.lesson.lessonType === 'HIRAGANA' || data?.lesson.lessonType === 'KATAKANA') ? 'Romaji' : 'Reading'}
                        </div>
                        <div className={`text-2xl ${(data?.lesson.lessonType === 'HIRAGANA' || data?.lesson.lessonType === 'KATAKANA') ? 'font-mono' : 'font-japanese'}`}>
                          {vocabItem.reading}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 text-sm text-gray-400">
                    Press Enter or click anywhere to continue →
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-sm">
                  {showHint && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-xl animate-fadeIn">
                      {questionType === 'meaning' ? (
                        isKanji && kanjiItem ? (
                          <div className="flex justify-center gap-6">
                            {kanjiItem.onYomi.length > 0 && (
                              <div className="text-center">
                                <div className="text-[10px] uppercase tracking-wider text-blue-500 mb-1">On</div>
                                <div className="text-lg font-japanese">{kanjiItem.onYomi.join('、')}</div>
                              </div>
                            )}
                            {kanjiItem.kunYomi.length > 0 && (
                              <div className="text-center">
                                <div className="text-[10px] uppercase tracking-wider text-orange-500 mb-1">Kun</div>
                                <div className="text-lg font-japanese">{kanjiItem.kunYomi.join('、')}</div>
                              </div>
                            )}
                          </div>
                        ) : vocabItem ? (
                          <div className="text-center">
                            <div className="text-[10px] uppercase tracking-wider text-purple-500 mb-1">
                              {(data?.lesson.lessonType === 'HIRAGANA' || data?.lesson.lessonType === 'KATAKANA') ? 'Romaji' : 'Reading'}
                            </div>
                            <div className={`text-lg ${(data?.lesson.lessonType === 'HIRAGANA' || data?.lesson.lessonType === 'KATAKANA') ? 'font-mono' : 'font-japanese'}`}>
                              {vocabItem.reading}
                            </div>
                          </div>
                        ) : null
                      ) : (
                        <div className="text-center">
                          <div className="text-[10px] uppercase tracking-wider text-green-600 mb-1">Meaning</div>
                          <div className="text-lg">{isKanji ? kanjiItem?.primaryMeaning : vocabItem?.primaryMeaning}</div>
                        </div>
                      )}
                    </div>
                  )}

                  <input
                    ref={inputRef}
                    type="text"
                    value={questionType === 'reading' ? (isKanaLesson ? rawInput : userAnswer) : rawInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      const isKana = data?.lesson.lessonType === 'HIRAGANA' || data?.lesson.lessonType === 'KATAKANA';
                      if (questionType === 'reading' && !isKana) {
                        // For regular lessons, convert romaji to hiragana
                        setRawInput(value);
                        setUserAnswer(romajiToHiragana(value));
                      } else {
                        // For kana lessons reading or any meaning questions, keep as-is
                        setRawInput(value);
                        setUserAnswer(value);
                      }
                      if (answerState === 'incorrect') {
                        setAnswerState('pending');
                      }
                    }}
                    placeholder={questionType === 'meaning' ? 'Type the meaning...' : 'Type the reading...'}
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className={`w-full px-4 py-3 text-lg text-center rounded-xl border-2 outline-none transition-all ${
                      answerState === 'incorrect'
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200 focus:border-pink-400 bg-white'
                    }`}
                  />
                  {answerState === 'incorrect' && (
                    <div className="mt-2 text-sm text-red-500 text-center">Try again!</div>
                  )}
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={toggleHint}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${
                        showHint ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
                  <div className="mt-2 text-xs text-gray-400 text-center">
                    Press Enter to submit
                  </div>
                  {/* Special character help for hiragana/katakana lessons */}
                  {(data?.lesson.lessonType === 'HIRAGANA' || data?.lesson.lessonType === 'KATAKANA') && questionType === 'reading' && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                      <div className="font-medium mb-1">💡 Typing Tips:</div>
                      <ul className="list-disc list-inside space-y-0.5 text-left">
                        <li>Small yu (じゅ): type &quot;ju&quot; or &quot;zyu&quot;</li>
                        <li>Double ん: type &quot;nn&quot;</li>
                        <li>Small tsu (って): type &quot;tte&quot; or &quot;tt&quot;</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

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

  return null;
}
