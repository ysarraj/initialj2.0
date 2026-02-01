import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getUserFromRequest } from '@/src/lib/auth';
import { canAccessLevel, getUserWithSubscription } from '@/src/lib/access';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.id;

    // Get user with subscription for access control
    const userWithSub = await getUserWithSubscription(userId);
    if (!userWithSub) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user settings (create if not exists)
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId },
      });
    }

    // Get all lessons with progress stats
    const lessons = await prisma.kanjiLesson.findMany({
      orderBy: { level: 'asc' },
      include: {
        _count: {
          select: {
            kanji: true,
            vocabulary: true,
          },
        },
      },
    });

    // Get progress for each lesson
    const lessonsWithProgress: Array<{
      id: string;
      level: number;
      title: string;
      description: string | null;
      kanjiCount: number;
      vocabCount: number;
      kanjiStarted: number;
      vocabStarted: number;
      isUnlocked: boolean;
      isComplete: boolean;
      progress: number;
      isAccessible: boolean;
    }> = [];

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];

      // Count kanji progress in this lesson
      const kanjiProgress = await prisma.userKanjiProgress.findMany({
        where: {
          userId,
          kanji: { lessonId: lesson.id },
        },
        select: { srsStage: true },
      });

      // Count vocab progress in this lesson
      const vocabProgress = await prisma.userVocabProgress.findMany({
        where: {
          userId,
          vocabulary: { lessonId: lesson.id },
        },
        select: { srsStage: true },
      });

      const kanjiStarted = kanjiProgress.length;
      const vocabStarted = vocabProgress.length;

      const totalItems = lesson._count.kanji + lesson._count.vocabulary;
      const learnedItems = kanjiStarted + vocabStarted;
      const progress = totalItems > 0 ? Math.round((learnedItems / totalItems) * 100) : 0;
      const isComplete = learnedItems >= totalItems && totalItems > 0;

      // Level 1 is always unlocked, others require previous level to be complete
      const previousLesson = i > 0 ? lessonsWithProgress[i - 1] : null;
      const isUnlocked = lesson.level === 1 || (previousLesson?.isComplete ?? false);

      // Check if user can access this level based on subscription
      const isAccessible = canAccessLevel(userWithSub, lesson.level);

      lessonsWithProgress.push({
        id: lesson.id,
        level: lesson.level,
        title: lesson.title,
        description: lesson.description,
        kanjiCount: lesson._count.kanji,
        vocabCount: lesson._count.vocabulary,
        kanjiStarted,
        vocabStarted,
        isUnlocked,
        isComplete,
        progress,
        isAccessible,
      });
    }

    return NextResponse.json({
      lessons: lessonsWithProgress,
      currentLevel: settings.currentLevel,
    });
  } catch (error) {
    console.error('Get lessons error:', error);
    return NextResponse.json({ error: 'Failed to get lessons' }, { status: 500 });
  }
}
