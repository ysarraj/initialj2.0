/**
 * Weekly XP System
 * Tracks XP points per week, resets every Monday
 */

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getWeekEnd(date: Date = new Date()): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

export function getWeekKey(date: Date = new Date()): string {
  const weekStart = getWeekStart(date);
  return weekStart.toISOString().split('T')[0]; // YYYY-MM-DD format
}

export function isSameWeek(date1: Date, date2: Date): boolean {
  return getWeekKey(date1) === getWeekKey(date2);
}
