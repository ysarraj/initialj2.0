import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getUserFromRequest } from '@/src/lib/auth';
import { SRS_INTERVALS } from '@/src/lib/srs';
import { addKanjiXP, addVocabXP, addWeeklyXP } from '@/src/lib/weekly-xp-service';

const SRS_STAGE_NAMES = {
  0: 'Locked',
  1: 'Apprentice 1',
  2: 'Apprentice 2',
  3: 'Apprentice 3',
  4: 'Apprentice 4',
  5: 'Guru 1',
  6: 'Guru 2',
  7: 'Master',
  8: 'Enlightened',
  9: 'Burned',
};

// GET - Get user progress stats
export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.id;
    const now = new Date();

    // Get total counts
    const totalKanji = await prisma.kanji.count();
    const totalVocab = await prisma.vocabulary.count();
    const totalLessons = await prisma.kanjiLesson.count();

    // Get user's kanji progress by SRS stage
    const kanjiByStage = await prisma.userKanjiProgress.groupBy({
      by: ['srsStage'],
      where: { userId },
      _count: { srsStage: true },
    });

    // Get user's vocab progress by SRS stage
    const vocabByStage = await prisma.userVocabProgress.groupBy({
      by: ['srsStage'],
      where: { userId },
      _count: { srsStage: true },
    });

    // Transform to stage counts
    const kanjiStages: Record<number, number> = {};
    const vocabStages: Record<number, number> = {};

    for (let i = 0; i <= 9; i++) {
      kanjiStages[i] = 0;
      vocabStages[i] = 0;
    }

    kanjiByStage.forEach(s => {
      kanjiStages[s.srsStage] = s._count.srsStage;
    });

    vocabByStage.forEach(s => {
      vocabStages[s.srsStage] = s._count.srsStage;
    });

    // Calculate totals
    const kanjiLearned = Object.entries(kanjiStages)
      .filter(([stage]) => parseInt(stage) >= 1)
      .reduce((sum, [, count]) => sum + count, 0);

    const vocabLearned = Object.entries(vocabStages)
      .filter(([stage]) => parseInt(stage) >= 1)
      .reduce((sum, [, count]) => sum + count, 0);

    const kanjiBurned = kanjiStages[9] || 0;
    const vocabBurned = vocabStages[9] || 0;

    // Count pending reviews
    const kanjiPendingReviews = await prisma.userKanjiProgress.count({
      where: {
        userId,
        srsStage: { gte: 1, lt: 9 },
        nextReviewAt: { lte: now },
      },
    });

    const vocabPendingReviews = await prisma.userVocabProgress.count({
      where: {
        userId,
        srsStage: { gte: 1, lt: 9 },
        nextReviewAt: { lte: now },
      },
    });

    // Get user settings
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    // Format stage data for chart
    const stageData = Object.entries(SRS_STAGE_NAMES).map(([stage, name]) => ({
      stage: parseInt(stage),
      name,
      kanji: kanjiStages[parseInt(stage)] || 0,
      vocab: vocabStages[parseInt(stage)] || 0,
    }));

    // Get next review coming up
    const upcomingReviews = await prisma.userKanjiProgress.findMany({
      where: {
        userId,
        srsStage: { gte: 1, lt: 9 },
        nextReviewAt: { gt: now },
      },
      orderBy: { nextReviewAt: 'asc' },
      take: 1,
      select: { nextReviewAt: true },
    });

    const nextReviewAt = upcomingReviews[0]?.nextReviewAt || null;

    // Calculate accuracy
    const kanjiStats = await prisma.userKanjiProgress.aggregate({
      where: { userId },
      _sum: {
        meaningCorrect: true,
        meaningIncorrect: true,
        readingCorrect: true,
        readingIncorrect: true,
      },
    });

    const vocabStats = await prisma.userVocabProgress.aggregate({
      where: { userId },
      _sum: {
        meaningCorrect: true,
        meaningIncorrect: true,
        readingCorrect: true,
        readingIncorrect: true,
      },
    });

    const totalCorrect = (kanjiStats._sum.meaningCorrect || 0) + (kanjiStats._sum.readingCorrect || 0) +
                         (vocabStats._sum.meaningCorrect || 0) + (vocabStats._sum.readingCorrect || 0);
    const totalIncorrect = (kanjiStats._sum.meaningIncorrect || 0) + (kanjiStats._sum.readingIncorrect || 0) +
                           (vocabStats._sum.meaningIncorrect || 0) + (vocabStats._sum.readingIncorrect || 0);
    const accuracy = totalCorrect + totalIncorrect > 0
      ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
      : 0;

    return NextResponse.json({
      totals: {
        kanji: totalKanji,
        vocab: totalVocab,
        lessons: totalLessons,
      },
      learned: {
        kanji: kanjiLearned,
        vocab: vocabLearned,
      },
      burned: {
        kanji: kanjiBurned,
        vocab: vocabBurned,
      },
      pendingReviews: {
        total: kanjiPendingReviews + vocabPendingReviews,
        kanji: kanjiPendingReviews,
        vocab: vocabPendingReviews,
      },
      stageData,
      currentLevel: settings?.currentLevel || 1,
      accuracy,
      nextReviewAt,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json({ error: 'Failed to get progress' }, { status: 500 });
  }
}

// POST - Mark items as studied
export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.id;
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const now = new Date();
    const results = { kanji: 0, vocab: 0, skippedAhead: 0 };

    for (const item of items) {
      const { id, type, firstAttemptCorrect, questionCount } = item;

      // If user answered correctly on first attempt without any help,
      // they already know this item - start at Guru 1 (stage 5)
      const knownPrior = firstAttemptCorrect === true;
      const normalizedQuestionCount =
        typeof questionCount === 'number' && questionCount > 0 ? questionCount : 1;
      const startingStage = knownPrior ? 5 : 1;
      const nextReview = new Date(now.getTime() + SRS_INTERVALS[startingStage as keyof typeof SRS_INTERVALS]);

      if (type === 'kanji') {
        const existing = await prisma.userKanjiProgress.findUnique({
          where: { userId_kanjiId: { userId, kanjiId: id } },
        });

        if (!existing) {
          await prisma.userKanjiProgress.create({
            data: {
              userId,
              kanjiId: id,
              srsStage: startingStage,
              unlockedAt: now,
              nextReviewAt: nextReview,
              meaningCorrect: knownPrior ? 1 : 0,
              readingCorrect: knownPrior ? 1 : 0,
            },
          });
          
          // Only add weekly XP for learning new kanji if NOT shortcutted
          // Shortcutted items (knownPrior = true) don't get XP - they need to be reviewed first
          if (!knownPrior) {
            await addWeeklyXP(userId, normalizedQuestionCount * 10);
          }
          
          results.kanji++;
          if (knownPrior) results.skippedAhead++;
        } else {
          // Item already exists - treat as a review and give XP for correct answers
          // Only give XP if NOT shortcutted (knownPrior = false means user answered correctly)
          if (!knownPrior) {
            // Simulate a review: increment correct counts and give XP
            const oldMeaningCorrect = existing.meaningCorrect;
            const oldReadingCorrect = existing.readingCorrect;
            const newMeaningCorrect = oldMeaningCorrect + 1;
            const newReadingCorrect =
              oldReadingCorrect + (normalizedQuestionCount === 2 ? 1 : 0);
            
            // Update the progress
            await prisma.userKanjiProgress.update({
              where: { userId_kanjiId: { userId, kanjiId: id } },
              data: {
                meaningCorrect: newMeaningCorrect,
                readingCorrect: newReadingCorrect,
                lastReviewedAt: now,
              },
            });
            
            // Give XP for the review (10 XP per correct answer)
            await addKanjiXP(
              userId,
              existing.srsStage, // oldStage
              existing.srsStage, // newStage (doesn't change in lesson review)
              oldMeaningCorrect, // oldMeaningCorrect
              newMeaningCorrect, // newMeaningCorrect
              oldReadingCorrect, // oldReadingCorrect
              newReadingCorrect, // newReadingCorrect
              false // isNewItem
            );
          }
        }
      } else if (type === 'vocab') {
        const existing = await prisma.userVocabProgress.findUnique({
          where: { userId_vocabularyId: { userId, vocabularyId: id } },
        });

        if (!existing) {
          await prisma.userVocabProgress.create({
            data: {
              userId,
              vocabularyId: id,
              srsStage: startingStage,
              unlockedAt: now,
              nextReviewAt: nextReview,
              meaningCorrect: knownPrior ? 1 : 0,
              readingCorrect: knownPrior ? 1 : 0,
            },
          });
          
          // Only add weekly XP for learning new vocabulary if NOT shortcutted
          // Shortcutted items (knownPrior = true) don't get XP - they need to be reviewed first
          if (!knownPrior) {
            await addWeeklyXP(userId, normalizedQuestionCount * 10);
          }
          
          results.vocab++;
          if (knownPrior) results.skippedAhead++;
        } else {
          // Item already exists - treat as a review and give XP for correct answers
          // Only give XP if NOT shortcutted (knownPrior = false means user answered correctly)
          if (!knownPrior) {
            // Simulate a review: increment correct counts and give XP
            const oldMeaningCorrect = existing.meaningCorrect;
            const oldReadingCorrect = existing.readingCorrect;
            const newMeaningCorrect = oldMeaningCorrect + 1;
            const newReadingCorrect =
              oldReadingCorrect + (normalizedQuestionCount === 2 ? 1 : 0);
            
            // Update the progress
            await prisma.userVocabProgress.update({
              where: { userId_vocabularyId: { userId, vocabularyId: id } },
              data: {
                meaningCorrect: newMeaningCorrect,
                readingCorrect: newReadingCorrect,
                lastReviewedAt: now,
              },
            });
            
            // Give XP for the review (10 XP per correct answer)
            await addVocabXP(
              userId,
              existing.srsStage, // oldStage
              existing.srsStage, // newStage (doesn't change in lesson review)
              oldMeaningCorrect, // oldMeaningCorrect
              newMeaningCorrect, // newMeaningCorrect
              oldReadingCorrect, // oldReadingCorrect
              newReadingCorrect, // newReadingCorrect
              false // isNewItem
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      created: results,
    });
  } catch (error) {
    console.error('Mark studied error:', error);
    return NextResponse.json({ error: 'Failed to mark items' }, { status: 500 });
  }
}
