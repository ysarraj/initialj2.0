import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getUserFromRequest } from '@/src/lib/auth';
import { canAccessLevel, getUserWithSubscription } from '@/src/lib/access';

// Helper to check if a lesson is unlocked
async function isLessonUnlocked(lessonLevel: number, userId: string): Promise<boolean> {
  // Level 1 is always unlocked
  if (lessonLevel === 1) return true;

  // Find the previous lesson
  const previousLesson = await prisma.kanjiLesson.findFirst({
    where: { level: lessonLevel - 1 },
    include: {
      _count: {
        select: { kanji: true, vocabulary: true },
      },
    },
  });

  if (!previousLesson) return true; // No previous lesson means unlocked

  // Count progress in previous lesson
  const kanjiProgress = await prisma.userKanjiProgress.count({
    where: {
      userId,
      kanji: { lessonId: previousLesson.id },
    },
  });

  const vocabProgress = await prisma.userVocabProgress.count({
    where: {
      userId,
      vocabulary: { lessonId: previousLesson.id },
    },
  });

  const totalItems = previousLesson._count.kanji + previousLesson._count.vocabulary;
  const learnedItems = kanjiProgress + vocabProgress;

  // Previous lesson must be 100% complete
  return learnedItems >= totalItems && totalItems > 0;
}

// Helper to parse JSON fields
const parseJsonField = (value: unknown): unknown => {
  if (value === null) return null;
  if (typeof value === 'string') return JSON.parse(value);
  return value;
};

// GET lesson by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authUser = await getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.id;

    const lesson = await prisma.kanjiLesson.findUnique({
      where: { id },
      include: {
        kanji: {
          orderBy: { sortOrder: 'asc' },
          include: {
            userProgress: {
              where: { userId },
            },
            vocabulary: {
              include: {
                vocabulary: {
                  include: {
                    userProgress: {
                      where: { userId },
                    },
                  },
                },
              },
            },
          },
        },
        vocabulary: {
          orderBy: { sortOrder: 'asc' },
          include: {
            userProgress: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Check if lesson is unlocked
    const unlocked = await isLessonUnlocked(lesson.level, userId);
    if (!unlocked) {
      return NextResponse.json(
        { error: 'Lesson locked', message: 'Complete the previous level first' },
        { status: 403 }
      );
    }

    // Check if user can access this level based on subscription
    const userWithSub = await getUserWithSubscription(userId);
    if (!userWithSub || !canAccessLevel(userWithSub, lesson.level)) {
      return NextResponse.json(
        { error: 'Subscription required', message: 'Upgrade to access this level' },
        { status: 402 }
      );
    }

    // Transform data for frontend
    const kanjiItems = lesson.kanji.map(k => ({
      id: k.id,
      character: k.character,
      meanings: parseJsonField(k.meanings) as string[],
      primaryMeaning: k.primaryMeaning,
      kunYomi: parseJsonField(k.kunYomi) as string[],
      onYomi: parseJsonField(k.onYomi) as string[],
      grade: k.grade,
      jlpt: k.jlpt,
      strokeCount: k.strokeCount,
      meaningMnemonic: k.meaningMnemonic,
      readingMnemonic: k.readingMnemonic,
      progress: k.userProgress[0] || null,
      relatedVocab: k.vocabulary.map(kv => ({
        id: kv.vocabulary.id,
        word: kv.vocabulary.word,
        reading: kv.vocabulary.reading,
        primaryMeaning: kv.vocabulary.primaryMeaning,
      })),
    }));

    const vocabItems = lesson.vocabulary.map(v => ({
      id: v.id,
      word: v.word,
      reading: v.reading,
      meanings: parseJsonField(v.meanings) as string[],
      primaryMeaning: v.primaryMeaning,
      partOfSpeech: v.partOfSpeech,
      meaningMnemonic: v.meaningMnemonic,
      readingMnemonic: v.readingMnemonic,
      progress: v.userProgress[0] || null,
    }));

    return NextResponse.json({
      lesson: {
        id: lesson.id,
        level: lesson.level,
        title: lesson.title,
        description: lesson.description,
      },
      kanji: kanjiItems,
      vocabulary: vocabItems,
    });
  } catch (error) {
    console.error('Get lesson error:', error);
    return NextResponse.json({ error: 'Failed to get lesson' }, { status: 500 });
  }
}

// POST - Start learning (create progress entries)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authUser = await getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.id;

    const lesson = await prisma.kanjiLesson.findUnique({
      where: { id },
      include: {
        kanji: true,
        vocabulary: true,
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Check if lesson is unlocked
    const unlocked = await isLessonUnlocked(lesson.level, userId);
    if (!unlocked) {
      return NextResponse.json(
        { error: 'Lesson locked', message: 'Complete the previous level first' },
        { status: 403 }
      );
    }

    // Check subscription access
    const userWithSub = await getUserWithSubscription(userId);
    if (!userWithSub || !canAccessLevel(userWithSub, lesson.level)) {
      return NextResponse.json(
        { error: 'Subscription required', message: 'Upgrade to access this level' },
        { status: 402 }
      );
    }

    // Ensure user settings exist
    await prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: { userId, currentLevel: 1 },
    });

    return NextResponse.json({
      success: true,
      message: `Started lesson ${lesson.level}`,
      kanjiCount: lesson.kanji.length,
      vocabCount: lesson.vocabulary.length,
    });
  } catch (error) {
    console.error('Start lesson error:', error);
    return NextResponse.json({ error: 'Failed to start lesson' }, { status: 500 });
  }
}
