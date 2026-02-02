import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getUserFromRequest } from '@/src/lib/auth';
import { canAccessLevel, getUserWithSubscription } from '@/src/lib/access';
import { SRS_INTERVALS, SRS_STAGE_NAMES } from '@/src/lib/srs';
import { addKanjiXP, addVocabXP } from '@/src/lib/weekly-xp-service';

// Helper to parse JSON fields
const parseJsonField = (value: unknown): unknown => {
  if (value === null) return null;
  if (typeof value === 'string') return JSON.parse(value);
  return value;
};

// GET - Get pending reviews
export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.id;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');

    // Get user with subscription for access control
    const userWithSub = await getUserWithSubscription(userId);
    if (!userWithSub) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();

    // Get kanji reviews - prioritize by SRS stage (lower = more urgent)
    const kanjiReviews = await prisma.userKanjiProgress.findMany({
      where: {
        userId,
        srsStage: { gte: 1, lt: 9 },
        nextReviewAt: { lte: now },
      },
      include: {
        kanji: {
          include: {
            lesson: true,
          },
        },
      },
      take: limit,
      orderBy: [
        { srsStage: 'asc' },
        { nextReviewAt: 'asc' },
      ],
    });

    // Get vocab reviews
    const vocabReviews = await prisma.userVocabProgress.findMany({
      where: {
        userId,
        srsStage: { gte: 1, lt: 9 },
        nextReviewAt: { lte: now },
      },
      include: {
        vocabulary: {
          include: {
            lesson: true,
          },
        },
      },
      take: limit,
      orderBy: [
        { srsStage: 'asc' },
        { nextReviewAt: 'asc' },
      ],
    });

    // Filter by accessible levels and combine reviews
    const reviews = [
      ...kanjiReviews
        .filter(r => canAccessLevel(userWithSub, r.kanji.lesson.level))
        .map(r => ({
          id: r.id,
          type: 'kanji' as const,
          itemId: r.kanjiId,
          character: r.kanji.character,
          meanings: parseJsonField(r.kanji.meanings) as string[],
          primaryMeaning: r.kanji.primaryMeaning,
          readings: {
            kun: parseJsonField(r.kanji.kunYomi) as string[],
            on: parseJsonField(r.kanji.onYomi) as string[],
          },
          srsStage: r.srsStage,
          srsName: SRS_STAGE_NAMES[r.srsStage as keyof typeof SRS_STAGE_NAMES],
        })),
      ...vocabReviews
        .filter(r => canAccessLevel(userWithSub, r.vocabulary.lesson.level))
        .map(r => ({
          id: r.id,
          type: 'vocabulary' as const,
          itemId: r.vocabularyId,
          character: r.vocabulary.word,
          meanings: parseJsonField(r.vocabulary.meanings) as string[],
          primaryMeaning: r.vocabulary.primaryMeaning,
          readings: {
            reading: r.vocabulary.reading,
          },
          srsStage: r.srsStage,
          srsName: SRS_STAGE_NAMES[r.srsStage as keyof typeof SRS_STAGE_NAMES],
        })),
    ];

    // Shuffle reviews
    const shuffled = reviews.sort(() => Math.random() - 0.5);

    // Get total pending count (filtered by accessible levels)
    const totalPending = shuffled.length;

    return NextResponse.json({
      reviews: shuffled.slice(0, limit),
      totalPending,
      kanjiPending: shuffled.filter(r => r.type === 'kanji').length,
      vocabPending: shuffled.filter(r => r.type === 'vocabulary').length,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ error: 'Failed to get reviews' }, { status: 500 });
  }
}

// POST - Submit review answer
export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.id;
    const body = await request.json();
    const { progressId, type, questionType, correct } = body;

    if (!progressId || !type || !questionType || typeof correct !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const now = new Date();

    if (type === 'kanji') {
      const progress = await prisma.userKanjiProgress.findUnique({
        where: { id: progressId },
      });

      if (!progress || progress.userId !== userId) {
        return NextResponse.json({ error: 'Invalid progress record' }, { status: 400 });
      }

      const updateData: Record<string, unknown> = {
        lastReviewedAt: now,
      };

      if (questionType === 'meaning') {
        if (correct) {
          updateData.meaningCorrect = { increment: 1 };
        } else {
          updateData.meaningIncorrect = { increment: 1 };
        }
      } else if (questionType === 'reading') {
        if (correct) {
          updateData.readingCorrect = { increment: 1 };
        } else {
          updateData.readingIncorrect = { increment: 1 };
        }
      }

      // Calculate new SRS stage
      let newStage = progress.srsStage;
      if (correct) {
        newStage = Math.min(9, progress.srsStage + 1);
      } else {
        const dropAmount = progress.srsStage >= 5 ? 2 : 1;
        newStage = Math.max(1, progress.srsStage - dropAmount);
      }

      updateData.srsStage = newStage;

      // Calculate next review time
      if (newStage === 9) {
        updateData.burnedAt = now;
        updateData.nextReviewAt = null;
      } else {
        const interval = SRS_INTERVALS[newStage as keyof typeof SRS_INTERVALS] || SRS_INTERVALS[1];
        updateData.nextReviewAt = new Date(now.getTime() + interval);
      }

      // Calculate new correct counts
      const newMeaningCorrect = questionType === 'meaning' && correct
        ? progress.meaningCorrect + 1
        : progress.meaningCorrect;
      const newReadingCorrect = questionType === 'reading' && correct
        ? progress.readingCorrect + 1
        : progress.readingCorrect;

      await prisma.userKanjiProgress.update({
        where: { id: progressId },
        data: updateData,
      });

      // Add weekly XP for the progress made
      await addKanjiXP(
        userId,
        progress.srsStage, // oldStage
        newStage, // newStage
        progress.meaningCorrect, // oldMeaningCorrect
        newMeaningCorrect, // newMeaningCorrect
        progress.readingCorrect, // oldReadingCorrect
        newReadingCorrect, // newReadingCorrect
        false // isNewItem
      );

      return NextResponse.json({
        success: true,
        newStage,
        stageName: SRS_STAGE_NAMES[newStage as keyof typeof SRS_STAGE_NAMES],
        burned: newStage === 9,
      });
    } else if (type === 'vocabulary') {
      const progress = await prisma.userVocabProgress.findUnique({
        where: { id: progressId },
      });

      if (!progress || progress.userId !== userId) {
        return NextResponse.json({ error: 'Invalid progress record' }, { status: 400 });
      }

      const updateData: Record<string, unknown> = {
        lastReviewedAt: now,
      };

      if (questionType === 'meaning') {
        if (correct) {
          updateData.meaningCorrect = { increment: 1 };
        } else {
          updateData.meaningIncorrect = { increment: 1 };
        }
      } else if (questionType === 'reading') {
        if (correct) {
          updateData.readingCorrect = { increment: 1 };
        } else {
          updateData.readingIncorrect = { increment: 1 };
        }
      }

      let newStage = progress.srsStage;
      if (correct) {
        newStage = Math.min(9, progress.srsStage + 1);
      } else {
        const dropAmount = progress.srsStage >= 5 ? 2 : 1;
        newStage = Math.max(1, progress.srsStage - dropAmount);
      }

      updateData.srsStage = newStage;

      if (newStage === 9) {
        updateData.burnedAt = now;
        updateData.nextReviewAt = null;
      } else {
        const interval = SRS_INTERVALS[newStage as keyof typeof SRS_INTERVALS] || SRS_INTERVALS[1];
        updateData.nextReviewAt = new Date(now.getTime() + interval);
      }

      // Calculate new correct counts
      const newMeaningCorrect = questionType === 'meaning' && correct
        ? progress.meaningCorrect + 1
        : progress.meaningCorrect;
      const newReadingCorrect = questionType === 'reading' && correct
        ? progress.readingCorrect + 1
        : progress.readingCorrect;

      await prisma.userVocabProgress.update({
        where: { id: progressId },
        data: updateData,
      });

      // Add weekly XP for the progress made
      await addVocabXP(
        userId,
        progress.srsStage, // oldStage
        newStage, // newStage
        progress.meaningCorrect, // oldMeaningCorrect
        newMeaningCorrect, // newMeaningCorrect
        progress.readingCorrect, // oldReadingCorrect
        newReadingCorrect, // newReadingCorrect
        false // isNewItem
      );

      return NextResponse.json({
        success: true,
        newStage,
        stageName: SRS_STAGE_NAMES[newStage as keyof typeof SRS_STAGE_NAMES],
        burned: newStage === 9,
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Submit review error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
