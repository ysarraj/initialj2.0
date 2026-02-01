/**
 * Utility functions for handling username display
 */

export function getDisplayUsername(
  username: string | null | undefined,
  usernameHidden: boolean | undefined,
  userId?: string
): string {
  if (usernameHidden) {
    return userId ? `User ${userId.slice(0, 8)}` : 'Hidden User';
  }
  return username || 'User';
}

export function getDisplayUsernameFromEmail(
  email: string,
  username: string | null | undefined,
  usernameHidden: boolean | undefined,
  userId?: string
): string {
  if (usernameHidden) {
    return userId ? `User ${userId.slice(0, 8)}` : 'Hidden User';
  }
  return username || email.split('@')[0];
}
