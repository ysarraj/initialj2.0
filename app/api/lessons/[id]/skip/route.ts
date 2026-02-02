import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getUserFromRequest } from '@/src/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = authUser.id;

    // Get the lesson
    const lesson = await prisma.kanjiLesson.findUnique({
      where: { id },
      include: {
        vocabulary: {
          select: { id: true },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Only allow skipping level 0 (Hiragana & Katakana)
    if (lesson.level !== 0) {
      return NextResponse.json(
        { error: 'Only the Hiragana & Katakana lesson can be skipped' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Burn all vocabulary in this lesson
    for (const vocab of lesson.vocabulary) {
      const existing = await prisma.userVocabProgress.findUnique({
        where: { userId_vocabularyId: { userId, vocabularyId: vocab.id } },
      });

      if (existing) {
        await prisma.userVocabProgress.update({
          where: { userId_vocabularyId: { userId, vocabularyId: vocab.id } },
          data: {
            srsStage: 9, // Burned
            burnedAt: now,
            nextReviewAt: null,
          },
        });
      } else {
        await prisma.userVocabProgress.create({
          data: {
            userId,
            vocabularyId: vocab.id,
            srsStage: 9, // Burned
            unlockedAt: now,
            burnedAt: now,
            nextReviewAt: null,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Hiragana & Katakana lesson skipped',
      burnedCount: lesson.vocabulary.length,
    });
  } catch (error) {
    console.error('Skip lesson error:', error);
    return NextResponse.json(
      { error: 'Failed to skip lesson' },
      { status: 500 }
    );
  }
}
