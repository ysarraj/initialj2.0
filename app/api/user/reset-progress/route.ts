import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getUserFromRequest } from '@/src/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.$transaction([
      prisma.userKanjiProgress.deleteMany({ where: { userId: authUser.id } }),
      prisma.userVocabProgress.deleteMany({ where: { userId: authUser.id } }),
      prisma.weeklyXP.deleteMany({ where: { userId: authUser.id } }),
      prisma.userSettings.updateMany({
        where: { userId: authUser.id },
        data: { currentLevel: 1 },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset progress error:', error);
    return NextResponse.json({ error: 'Failed to reset progress' }, { status: 500 });
  }
}
