import { prisma } from './prisma';
import { getWeekStart, getWeekEnd } from './weekly-xp';
import { calculateKanjiXP, calculateVocabXP } from './xp';

/**
 * Get current day of week in CET (Central European Time)
 * Uses Europe/Paris timezone which is CET/CEST
 */
function getDayOfWeekCET(): number {
  const now = new Date();
  // Use Intl.DateTimeFormat to get the day in CET timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    weekday: 'long',
  });
  const dayName = formatter.format(now);
  // Convert day name to number (Sunday = 0, Monday = 1, etc.)
  const dayMap: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
  };
  return dayMap[dayName] ?? 0;
}

/**
 * Check if today is Sunday in CET (double XP day)
 * Double XP is active from Sunday 00:00 CET to Sunday 23:59:59 CET
 */
function isSundayCET(): boolean {
  return getDayOfWeekCET() === 0; // 0 = Sunday
}

/**
 * Get XP multiplier based on day of week in CET
 * Sunday = 2x XP (from 00:00 to 23:59:59 CET)
 */
function getXPMultiplier(): number {
  return isSundayCET() ? 2 : 1;
}

/**
 * Add weekly XP for a user
 * This should be called whenever XP is earned (learning items, reviews, etc.)
 * Sunday is double XP day!
 */
export async function addWeeklyXP(
  userId: string,
  xpAmount: number
): Promise<void> {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();

  // Apply double XP multiplier on Sundays
  const multiplier = getXPMultiplier();
  const finalXPAmount = xpAmount * multiplier;

  // Normalize weekStart to ensure consistent storage (remove time component)
  const normalizedWeekStart = new Date(weekStart);
  normalizedWeekStart.setHours(0, 0, 0, 0);

  await prisma.weeklyXP.upsert({
    where: {
      userId_weekStart: {
        userId,
        weekStart: normalizedWeekStart,
      },
    },
    update: {
      xp: { increment: finalXPAmount },
    },
    create: {
      userId,
      weekStart: normalizedWeekStart,
      weekEnd,
      xp: finalXPAmount,
    },
  });
}

/**
 * Calculate and add XP when a kanji is learned or reviewed
 * Only counts XP gained this week, not total XP
 */
export async function addKanjiXP(
  userId: string,
  oldStage: number,
  newStage: number,
  oldMeaningCorrect: number,
  newMeaningCorrect: number,
  oldReadingCorrect: number,
  newReadingCorrect: number,
  isNewItem: boolean = false
): Promise<void> {
  let xpToAdd = 0;
  
  // For new items, give 10 XP (same as a review)
  if (isNewItem && newStage >= 1) {
    xpToAdd += 10; // Same XP as a review
  }
  
  // Bonus XP for burning (only if newly burned this week)
  if (oldStage !== 9 && newStage === 9) {
    xpToAdd += 50; // Bonus for burning a kanji
  }
  
  // XP for new correct answers (reviews) - 10 XP per correct answer
  // This works even if the item is already burned (stage 9)
  // because we count the difference in correct answers
  const meaningCorrectDiff = newMeaningCorrect - oldMeaningCorrect;
  const readingCorrectDiff = newReadingCorrect - oldReadingCorrect;
  
  // Always give XP for correct answers, even if item is already burned
  if (meaningCorrectDiff > 0) {
    xpToAdd += meaningCorrectDiff * 10;
  }
  if (readingCorrectDiff > 0) {
    xpToAdd += readingCorrectDiff * 10;
  }
  
  if (xpToAdd > 0) {
    await addWeeklyXP(userId, xpToAdd);
  }
}

/**
 * Calculate and add XP when vocabulary is learned or reviewed
 * Only counts XP gained this week, not total XP
 */
export async function addVocabXP(
  userId: string,
  oldStage: number,
  newStage: number,
  oldMeaningCorrect: number,
  newMeaningCorrect: number,
  oldReadingCorrect: number,
  newReadingCorrect: number,
  isNewItem: boolean = false
): Promise<void> {
  let xpToAdd = 0;
  
  // For new items, give 10 XP (same as a review)
  if (isNewItem && newStage >= 1) {
    xpToAdd += 10; // Same XP as a review
  }
  
  // Bonus XP for burning (only if newly burned this week)
  if (oldStage !== 9 && newStage === 9) {
    xpToAdd += 50; // Bonus for burning vocabulary
  }
  
  // XP for new correct answers (reviews) - 10 XP per correct answer
  // This works even if the item is already burned (stage 9)
  // because we count the difference in correct answers
  const meaningCorrectDiff = newMeaningCorrect - oldMeaningCorrect;
  const readingCorrectDiff = newReadingCorrect - oldReadingCorrect;
  
  // Always give XP for correct answers, even if item is already burned
  if (meaningCorrectDiff > 0) {
    xpToAdd += meaningCorrectDiff * 10;
  }
  if (readingCorrectDiff > 0) {
    xpToAdd += readingCorrectDiff * 10;
  }
  
  if (xpToAdd > 0) {
    await addWeeklyXP(userId, xpToAdd);
  }
}
