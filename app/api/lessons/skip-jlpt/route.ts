import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getUserFromRequest } from '@/src/lib/auth';
import { canAccessLevel, getUserWithSubscription } from '@/src/lib/access';

const JLPT_START_LEVEL: Record<number, number> = {
  5: 1,
  4: 11,
  3: 26,
  2: 51,
  1: 76,
};

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const targetJlpt = Number(body?.targetJlpt);
    const targetStartLevel = JLPT_START_LEVEL[targetJlpt];

    if (!targetStartLevel) {
      return NextResponse.json({ error: 'Invalid JLPT target' }, { status: 400 });
    }

    const userWithSub = await getUserWithSubscription(authUser.id);
    if (!userWithSub) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!canAccessLevel(userWithSub, targetStartLevel)) {
      return NextResponse.json({ error: 'Plan does not allow this level' }, { status: 403 });
    }

    const lessonsToBurn = await prisma.kanjiLesson.findMany({
      where: {
        level: { lt: targetStartLevel },
      },
      select: { id: true },
    });

    const lessonIds = lessonsToBurn.map((lesson) => lesson.id);
    if (lessonIds.length === 0) {
      const targetLesson = await prisma.kanjiLesson.findFirst({
        where: { level: targetStartLevel },
        select: { id: true },
      });
      return NextResponse.json({
        success: true,
        burnedKanji: 0,
        burnedVocab: 0,
        targetLessonId: targetLesson?.id ?? null,
      });
    }

    const [kanjiItems, vocabItems] = await Promise.all([
      prisma.kanji.findMany({
        where: { lessonId: { in: lessonIds } },
        select: { id: true },
      }),
      prisma.vocabulary.findMany({
        where: { lessonId: { in: lessonIds } },
        select: { id: true },
      }),
    ]);

    const kanjiIds = kanjiItems.map((item) => item.id);
    const vocabIds = vocabItems.map((item) => item.id);

    const [existingKanji, existingVocab] = await Promise.all([
      prisma.userKanjiProgress.findMany({
        where: { userId: authUser.id, kanjiId: { in: kanjiIds } },
        select: { kanjiId: true },
      }),
      prisma.userVocabProgress.findMany({
        where: { userId: authUser.id, vocabularyId: { in: vocabIds } },
        select: { vocabularyId: true },
      }),
    ]);

    const existingKanjiSet = new Set(existingKanji.map((item) => item.kanjiId));
    const existingVocabSet = new Set(existingVocab.map((item) => item.vocabularyId));
    const now = new Date();

    const kanjiCreates = kanjiIds
      .filter((id) => !existingKanjiSet.has(id))
      .map((id) => ({
        userId: authUser.id,
        kanjiId: id,
        srsStage: 9,
        unlockedAt: now,
        lastReviewedAt: now,
        burnedAt: now,
        nextReviewAt: null,
      }));

    const vocabCreates = vocabIds
      .filter((id) => !existingVocabSet.has(id))
      .map((id) => ({
        userId: authUser.id,
        vocabularyId: id,
        srsStage: 9,
        unlockedAt: now,
        lastReviewedAt: now,
        burnedAt: now,
        nextReviewAt: null,
      }));

    const transactionQueries: Parameters<typeof prisma.$transaction>[0] = [];

    if (kanjiIds.length) {
      transactionQueries.push(
        prisma.userKanjiProgress.updateMany({
          where: { userId: authUser.id, kanjiId: { in: kanjiIds } },
          data: { srsStage: 9, burnedAt: now, nextReviewAt: null, lastReviewedAt: now },
        })
      );
    }

    if (vocabIds.length) {
      transactionQueries.push(
        prisma.userVocabProgress.updateMany({
          where: { userId: authUser.id, vocabularyId: { in: vocabIds } },
          data: { srsStage: 9, burnedAt: now, nextReviewAt: null, lastReviewedAt: now },
        })
      );
    }

    if (kanjiCreates.length) {
      transactionQueries.push(prisma.userKanjiProgress.createMany({ data: kanjiCreates }));
    }

    if (vocabCreates.length) {
      transactionQueries.push(prisma.userVocabProgress.createMany({ data: vocabCreates }));
    }

    if (transactionQueries.length) {
      await prisma.$transaction(transactionQueries);
    }

    const targetLesson = await prisma.kanjiLesson.findFirst({
      where: { level: targetStartLevel },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      burnedKanji: kanjiIds.length,
      burnedVocab: vocabIds.length,
      targetLessonId: targetLesson?.id ?? null,
    });
  } catch (error) {
    console.error('Skip JLPT levels error:', error);
    return NextResponse.json({ error: 'Failed to skip levels' }, { status: 500 });
  }
}
