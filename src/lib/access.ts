import { prisma } from './prisma';

export interface UserWithSubscription {
  id: string;
  role: string;
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd: Date | null;
  } | null;
}

// Check if user can access a specific JLPT level based on lesson level
export function canAccessLevel(user: UserWithSubscription, lessonLevel: number): boolean {
  // Admins have full access
  if (user.role === 'ADMIN') return true;

  // N5 is free (levels 1-10)
  if (lessonLevel <= 10) return true;

  // Paid levels require active subscription
  const sub = user.subscription;
  if (!sub) return false;

  return (
    sub.status === 'ACTIVE' &&
    (sub.plan === 'MONTHLY' || sub.plan === 'YEARLY')
  );
}

// Get JLPT level from lesson level
export function getJLPTLevel(lessonLevel: number): string {
  if (lessonLevel <= 10) return 'N5';  // Free
  if (lessonLevel <= 25) return 'N4';  // Paid
  if (lessonLevel <= 50) return 'N3';  // Paid
  if (lessonLevel <= 75) return 'N2';  // Paid
  return 'N1';                          // Paid
}

// Get JLPT level number from lesson level (5=easiest, 1=hardest)
export function getJLPTNumber(lessonLevel: number): number {
  if (lessonLevel <= 10) return 5;
  if (lessonLevel <= 25) return 4;
  if (lessonLevel <= 50) return 3;
  if (lessonLevel <= 75) return 2;
  return 1;
}

// Check if a JLPT level is free
export function isFreeTier(lessonLevel: number): boolean {
  return lessonLevel <= 10;
}

// Get user with subscription data
export async function getUserWithSubscription(userId: string): Promise<UserWithSubscription | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      subscription: {
        select: {
          plan: true,
          status: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  return user;
}

// Check if user has active paid subscription
export function hasActiveSubscription(user: UserWithSubscription): boolean {
  if (user.role === 'ADMIN') return true;

  const sub = user.subscription;
  if (!sub) return false;

  return (
    sub.status === 'ACTIVE' &&
    (sub.plan === 'MONTHLY' || sub.plan === 'YEARLY')
  );
}

// Get accessible level range for user
export function getAccessibleLevelRange(user: UserWithSubscription): { min: number; max: number } {
  if (user.role === 'ADMIN' || hasActiveSubscription(user)) {
    return { min: 1, max: 100 };
  }
  return { min: 1, max: 10 }; // N5 only
}
