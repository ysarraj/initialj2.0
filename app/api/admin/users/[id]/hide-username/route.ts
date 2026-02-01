import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth, isAdmin } from '@/src/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireAuth(request);

    if (!isAdmin(authUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { hidden } = body;

    if (typeof hidden !== 'boolean') {
      return NextResponse.json(
        { error: 'hidden must be a boolean' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { usernameHidden: hidden },
      select: {
        id: true,
        email: true,
        username: true,
        usernameHidden: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Hide username error:', error);
    return NextResponse.json(
      { error: 'Failed to update username visibility' },
      { status: 500 }
    );
  }
}
