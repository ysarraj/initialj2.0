import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getUserFromRequest } from '@/src/lib/auth';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const rawUsername = typeof body?.username === 'string' ? body.username.trim() : '';

    if (!rawUsername) {
      const user = await prisma.user.update({
        where: { id: authUser.id },
        data: { username: null },
        select: { username: true },
      });
      return NextResponse.json({ username: user.username });
    }

    if (!USERNAME_REGEX.test(rawUsername)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters, letters/numbers/underscore only' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: { username: rawUsername },
      select: { username: true },
    });

    return NextResponse.json({ username: user.username });
  } catch (error) {
    console.error('Update username error:', error);
    return NextResponse.json({ error: 'Failed to update username' }, { status: 500 });
  }
}
