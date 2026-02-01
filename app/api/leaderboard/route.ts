import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getUserFromRequest } from '@/src/lib/auth';
import { getWeekStart, getWeekEnd } from '@/src/lib/weekly-xp';
import { getDisplayUsernameFromEmail } from '@/src/lib/username';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current week boundaries
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();

    // Normalize weekStart to ensure exact match (remove time component)
    const normalizedWeekStart = new Date(weekStart);
    normalizedWeekStart.setHours(0, 0, 0, 0);
    const normalizedWeekEnd = new Date(normalizedWeekStart);
    normalizedWeekEnd.setDate(normalizedWeekEnd.getDate() + 7); // End of week

    // Get all users with their weekly XP for current week
    // Use gte and lt to handle any timezone or precision issues
    // Include ALL users (USER, ADMIN, etc.) in the leaderboard
    const weeklyXPEntries = await prisma.weeklyXP.findMany({
      where: {
        weekStart: {
          gte: normalizedWeekStart,
          lt: normalizedWeekEnd,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            usernameHidden: true,
            email: true,
          },
        },
      },
      orderBy: {
        xp: 'desc',
      },
    });

    // Transform to leaderboard format
    const leaderboard = weeklyXPEntries
      .map((entry) => ({
        userId: entry.user.id,
        username: getDisplayUsernameFromEmail(
          entry.user.email,
          entry.user.username,
          entry.user.usernameHidden,
          entry.user.id
        ),
        email: entry.user.email,
        xp: entry.xp,
      }))
      .filter((user) => user.xp > 0); // Only show users with XP

    // Get top users: if less than 10, show all active users; otherwise show top 10
    const topUsers = leaderboard.length < 10 
      ? leaderboard.map((user, index) => ({
          ...user,
          rank: index + 1,
        }))
      : leaderboard.slice(0, 10).map((user, index) => ({
          ...user,
          rank: index + 1,
        }));

    // Find current user's rank
    const currentUserIndex = leaderboard.findIndex((user) => user.userId === authUser.id);
    const currentUserRank = currentUserIndex >= 0 ? currentUserIndex + 1 : null;
    const currentUser = currentUserIndex >= 0 ? leaderboard[currentUserIndex] : null;

    // If user is not in top users list, get their position and nearby users
    let userContext: typeof leaderboard = [];
    const topUsersCount = topUsers.length;
    if (currentUserRank && currentUserRank > topUsersCount) {
      // Get 2 users above and 2 users below
      const start = Math.max(0, currentUserRank - 3);
      const end = Math.min(leaderboard.length, currentUserRank + 2);
      userContext = leaderboard.slice(start, end).map((user, index) => ({
        ...user,
        rank: start + index + 1,
      }));
    }

    return NextResponse.json({
      top10: topUsers, // Keep the name for backward compatibility, but contains all active users if < 10
      currentUser: currentUser
        ? {
            ...currentUser,
            rank: currentUserRank,
          }
        : null,
      userContext: userContext.length > 0 ? userContext : null,
      totalUsers: leaderboard.length,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
