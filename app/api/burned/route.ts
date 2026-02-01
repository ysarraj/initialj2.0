import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getUserFromRequest } from '@/src/lib/auth';

// Helper to parse JSON fields
const parseJsonField = (value: unknown): unknown => {
  if (value === null) return null;
  if (typeof value === 'string') return JSON.parse(value);
  return value;
};

// GET - List all burned items
export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.id;

    // Get burned kanji
    const burnedKanji = await prisma.userKanjiProgress.findMany({
      where: {
        userId,
        srsStage: 9,
      },
      include: {
        kanji: true,
      },
      orderBy: { burnedAt: 'desc' },
    });

    // Get burned vocabulary
    const burnedVocab = await prisma.userVocabProgress.findMany({
      where: {
        userId,
        srsStage: 9,
      },
      include: {
        vocabulary: true,
      },
      orderBy: { burnedAt: 'desc' },
    });

    // Format response
    const items = [
      ...burnedKanji.map(p => ({
        type: 'kanji' as const,
        id: p.kanjiId,
        character: p.kanji.character,
        meanings: parseJsonField(p.kanji.meanings),
        primaryMeaning: p.kanji.primaryMeaning,
        kunYomi: parseJsonField(p.kanji.kunYomi),
        onYomi: parseJsonField(p.kanji.onYomi),
        burnedAt: p.burnedAt,
        meaningCorrect: p.meaningCorrect,
        meaningIncorrect: p.meaningIncorrect,
        readingCorrect: p.readingCorrect,
        readingIncorrect: p.readingIncorrect,
      })),
      ...burnedVocab.map(p => ({
        type: 'vocab' as const,
        id: p.vocabularyId,
        character: p.vocabulary.word,
        meanings: parseJsonField(p.vocabulary.meanings),
        primaryMeaning: p.vocabulary.primaryMeaning,
        reading: p.vocabulary.reading,
        burnedAt: p.burnedAt,
        meaningCorrect: p.meaningCorrect,
        meaningIncorrect: p.meaningIncorrect,
        readingCorrect: p.readingCorrect,
        readingIncorrect: p.readingIncorrect,
      })),
    ].sort((a, b) => {
      const aTime = a.burnedAt?.getTime() || 0;
      const bTime = b.burnedAt?.getTime() || 0;
      return bTime - aTime;
    });

    return NextResponse.json({
      items,
      counts: {
        kanji: burnedKanji.length,
        vocab: burnedVocab.length,
        total: burnedKanji.length + burnedVocab.length,
      },
    });
  } catch (error) {
    console.error('Get burned error:', error);
    return NextResponse.json({ error: 'Failed to get burned items' }, { status: 500 });
  }
}

// POST - Burn an item directly (set to stage 9)
export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.id;
    const body = await request.json();
    const { id, type } = body;

    if (!id || !type) {
      return NextResponse.json({ error: 'Missing id or type' }, { status: 400 });
    }

    const now = new Date();

    if (type === 'kanji') {
      const existing = await prisma.userKanjiProgress.findUnique({
        where: { userId_kanjiId: { userId, kanjiId: id } },
      });

      if (existing) {
        await prisma.userKanjiProgress.update({
          where: { userId_kanjiId: { userId, kanjiId: id } },
          data: {
            srsStage: 9,
            burnedAt: now,
            nextReviewAt: null,
          },
        });
      } else {
        await prisma.userKanjiProgress.create({
          data: {
            userId,
            kanjiId: id,
            srsStage: 9,
            unlockedAt: now,
            burnedAt: now,
            nextReviewAt: null,
          },
        });
      }
    } else if (type === 'vocab') {
      const existing = await prisma.userVocabProgress.findUnique({
        where: { userId_vocabularyId: { userId, vocabularyId: id } },
      });

      if (existing) {
        await prisma.userVocabProgress.update({
          where: { userId_vocabularyId: { userId, vocabularyId: id } },
          data: {
            srsStage: 9,
            burnedAt: now,
            nextReviewAt: null,
          },
        });
      } else {
        await prisma.userVocabProgress.create({
          data: {
            userId,
            vocabularyId: id,
            srsStage: 9,
            unlockedAt: now,
            burnedAt: now,
            nextReviewAt: null,
          },
        });
      }
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, burned: true });
  } catch (error) {
    console.error('Burn item error:', error);
    return NextResponse.json({ error: 'Failed to burn item' }, { status: 500 });
  }
}

// PATCH - Unburn an item (reset to Apprentice 1)
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.id;
    const body = await request.json();
    const { id, type } = body;

    if (!id || !type) {
      return NextResponse.json({ error: 'Missing id or type' }, { status: 400 });
    }

    const now = new Date();
    // Reset to Apprentice 1 with 4-hour review
    const nextReview = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    if (type === 'kanji') {
      await prisma.userKanjiProgress.update({
        where: { userId_kanjiId: { userId, kanjiId: id } },
        data: {
          srsStage: 1,
          burnedAt: null,
          nextReviewAt: nextReview,
        },
      });
    } else if (type === 'vocab') {
      await prisma.userVocabProgress.update({
        where: { userId_vocabularyId: { userId, vocabularyId: id } },
        data: {
          srsStage: 1,
          burnedAt: null,
          nextReviewAt: nextReview,
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, unburned: true });
  } catch (error) {
    console.error('Unburn item error:', error);
    return NextResponse.json({ error: 'Failed to unburn item' }, { status: 500 });
  }
}
