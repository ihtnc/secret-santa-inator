/**
 * Utility functions for localStorage operations
 */

/**
 * Safely gets the creatorCode from localStorage with proper window checking
 * @returns The creatorCode string or empty string if not found or on server
 */
export function getCreatorCode(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return localStorage.getItem('creatorCode') || '';
}

/**
 * Safely sets the creatorCode in localStorage
 * @param code The creator code to store
 */
export function setCreatorCode(code: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('creatorCode', code);
  }
}

/**
 * Safely removes the creatorCode from localStorage
 */
export function removeCreatorCode(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('creatorCode');
  }
}