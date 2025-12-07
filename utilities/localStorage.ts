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

/**
 * Safely gets the hasDemoGroups flag from localStorage
 * @returns True if demo groups have been created, false otherwise
 */
export function getHasDemoGroups(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return localStorage.getItem('hasDemoGroups') === 'true';
}

/**
 * Safely sets the hasDemoGroups flag in localStorage
 */
export function setHasDemoGroups(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('hasDemoGroups', 'true');
  }
}

/**
 * Safely removes the hasDemoGroups flag from localStorage
 */
export function removeHasDemoGroups(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hasDemoGroups');
  }
}