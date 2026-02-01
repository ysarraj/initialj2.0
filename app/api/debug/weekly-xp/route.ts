import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth, isAdmin } from '@/src/lib/auth';
import { getWeekStart } from '@/src/lib/weekly-xp';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    if (!isAdmin(authUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const weekStart = getWeekStart();
    const normalizedWeekStart = new Date(weekStart);
    normalizedWeekStart.setHours(0, 0, 0, 0);

    // Get all weekly XP entries for current week
    const weeklyXPEntries = await prisma.weeklyXP.findMany({
      where: {
        weekStart: {
          gte: normalizedWeekStart,
          lt: new Date(normalizedWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        xp: 'desc',
      },
    });

    // Get all users to see who might be missing
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        kanjiProgress: {
          select: {
            srsStage: true,
            unlockedAt: true,
          },
        },
        vocabProgress: {
          select: {
            srsStage: true,
            unlockedAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      weekStart: normalizedWeekStart.toISOString(),
      weeklyXPEntries,
      allUsers: allUsers.map(u => ({
        id: u.id,
        email: u.email,
        username: u.username,
        role: u.role,
        hasProgress: u.kanjiProgress.length > 0 || u.vocabProgress.length > 0,
        kanjiCount: u.kanjiProgress.length,
        vocabCount: u.vocabProgress.length,
        hasWeeklyXP: weeklyXPEntries.some(e => e.userId === u.id),
      })),
    });
  } catch (error) {
    console.error('Debug weekly XP error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug info' },
      { status: 500 }
    );
  }
}
