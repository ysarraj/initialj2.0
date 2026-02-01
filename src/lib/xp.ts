/**
 * XP Calculation System
 * 
 * Points are awarded based on:
 * - Kanji learned (stage >= 1): 10 XP
 * - Vocabulary learned (stage >= 1): 5 XP
 * - Kanji burned (stage 9): 50 bonus XP
 * - Vocabulary burned (stage 9): 25 bonus XP
 * - Correct reviews: 1 XP per correct answer
 */

export function calculateKanjiXP(srsStage: number, meaningCorrect: number, readingCorrect: number): number {
  let xp = 0;
  
  // Base XP for learning (unlocked and started)
  if (srsStage >= 1) {
    xp += 10; // Base XP for learning a kanji
  }
  
  // Bonus XP for burning (mastering)
  if (srsStage === 9) {
    xp += 50; // Bonus for burning a kanji
  }
  
  // XP for correct answers (reviews)
  xp += meaningCorrect * 1;
  xp += readingCorrect * 1;
  
  return xp;
}

export function calculateVocabXP(srsStage: number, meaningCorrect: number, readingCorrect: number): number {
  let xp = 0;
  
  // Base XP for learning (unlocked and started)
  if (srsStage >= 1) {
    xp += 5; // Base XP for learning vocabulary
  }
  
  // Bonus XP for burning (mastering)
  if (srsStage === 9) {
    xp += 25; // Bonus for burning vocabulary
  }
  
  // XP for correct answers (reviews)
  xp += meaningCorrect * 1;
  xp += readingCorrect * 1;
  
  return xp;
}

export function calculateTotalXP(
  kanjiProgress: Array<{ srsStage: number; meaningCorrect: number; readingCorrect: number }>,
  vocabProgress: Array<{ srsStage: number; meaningCorrect: number; readingCorrect: number }>
): number {
  let totalXP = 0;
  
  // Calculate XP from kanji progress
  for (const progress of kanjiProgress) {
    totalXP += calculateKanjiXP(progress.srsStage, progress.meaningCorrect, progress.readingCorrect);
  }
  
  // Calculate XP from vocabulary progress
  for (const progress of vocabProgress) {
    totalXP += calculateVocabXP(progress.srsStage, progress.meaningCorrect, progress.readingCorrect);
  }
  
  return totalXP;
}
