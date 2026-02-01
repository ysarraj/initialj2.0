// SRS (Spaced Repetition System) intervals in milliseconds
export const SRS_INTERVALS = {
  1: 4 * 60 * 60 * 1000,         // Apprentice 1: 4 hours
  2: 8 * 60 * 60 * 1000,         // Apprentice 2: 8 hours
  3: 24 * 60 * 60 * 1000,        // Apprentice 3: 1 day
  4: 2 * 24 * 60 * 60 * 1000,    // Apprentice 4: 2 days
  5: 7 * 24 * 60 * 60 * 1000,    // Guru 1: 1 week
  6: 14 * 24 * 60 * 60 * 1000,   // Guru 2: 2 weeks
  7: 30 * 24 * 60 * 60 * 1000,   // Master: 1 month
  8: 120 * 24 * 60 * 60 * 1000,  // Enlightened: 4 months
} as const;

export const SRS_STAGE_NAMES = {
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
} as const;

export const SRS_STAGE_COLORS = {
  0: '#e5e5e5', // Locked - gray
  1: '#1F2922', // Apprentice 1
  2: '#2B322B', // Apprentice 2
  3: '#373A34', // Apprentice 3
  4: '#4E4B46', // Apprentice 4
  5: '#6D685F', // Guru 1
  6: '#8C8578', // Guru 2
  7: '#C9BEAA', // Master
  8: '#DED7BD', // Enlightened
  9: '#C73E1D', // Burned
} as const;

// Calculate next review date based on SRS stage
export function getNextReviewDate(stage: number): Date | null {
  if (stage >= 9) return null; // Burned items don't need reviews

  const interval = SRS_INTERVALS[stage as keyof typeof SRS_INTERVALS] || SRS_INTERVALS[1];
  return new Date(Date.now() + interval);
}

// Calculate new SRS stage after a review
export function calculateNewStage(currentStage: number, correct: boolean): number {
  if (correct) {
    // Move up one stage, max 9 (burned)
    return Math.min(9, currentStage + 1);
  } else {
    // Drop back (more for higher stages)
    const dropAmount = currentStage >= 5 ? 2 : 1;
    return Math.max(1, currentStage - dropAmount);
  }
}

// Get stage name from number
export function getStageName(stage: number): string {
  return SRS_STAGE_NAMES[stage as keyof typeof SRS_STAGE_NAMES] || 'Unknown';
}

// Get stage color from number (returns hex color)
export function getStageColor(stage: number): string {
  return SRS_STAGE_COLORS[stage as keyof typeof SRS_STAGE_COLORS] || '#e5e5e5';
}

// Check if an item is due for review
export function isDueForReview(nextReviewAt: Date | null): boolean {
  if (!nextReviewAt) return false;
  return new Date(nextReviewAt) <= new Date();
}

// Format time until review in human-readable format
export function formatTimeUntilReview(nextReviewAt: Date | null): string {
  if (!nextReviewAt) return 'No review scheduled';

  const now = new Date();
  const reviewDate = new Date(nextReviewAt);
  const diffMs = reviewDate.getTime() - now.getTime();

  if (diffMs <= 0) return 'Now';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
