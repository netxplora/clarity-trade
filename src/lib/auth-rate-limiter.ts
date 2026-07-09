/**
 * Login Rate Limiter — Brute Force Protection
 * 
 * Implements client-side progressive delays and lockout after
 * repeated failed login attempts. Uses sessionStorage so resets
 * are limited to the browser session.
 * 
 * NOTE: This is a client-side complement. Server-side rate limiting
 * (via Supabase or API gateway) is still required for full protection.
 */

const STORAGE_KEY = 'ct_login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const PROGRESSIVE_DELAYS = [0, 1000, 2000, 4000, 8000]; // ms delay after each failed attempt

interface AttemptRecord {
  count: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

function getAttempts(key: string = 'default'): AttemptRecord {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_KEY}_${key}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore parse errors
  }
  return { count: 0, lastAttempt: 0, lockedUntil: null };
}

function setAttempts(record: AttemptRecord, key: string = 'default'): void {
  try {
    sessionStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(record));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if the user is currently locked out.
 * Returns the number of seconds remaining if locked, or 0 if not locked.
 */
export function getSecondsUntilUnlock(key: string = 'default'): number {
  const record = getAttempts(key);
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    return Math.ceil((record.lockedUntil - Date.now()) / 1000);
  }
  // If lockout has expired, clear it
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    setAttempts({ count: 0, lastAttempt: 0, lockedUntil: null }, key);
  }
  return 0;
}

/**
 * Check if user is locked out.
 */
export function isLockedOut(key: string = 'default'): boolean {
  return getSecondsUntilUnlock(key) > 0;
}

/**
 * Get the progressive delay (in ms) based on current failed attempt count.
 * Call this BEFORE attempting the login to enforce the delay.
 */
export function getProgressiveDelay(key: string = 'default'): number {
  const record = getAttempts(key);
  const index = Math.min(record.count, PROGRESSIVE_DELAYS.length - 1);
  return PROGRESSIVE_DELAYS[index];
}

/**
 * Record a failed login attempt. Returns the updated attempt count.
 * If MAX_ATTEMPTS is reached, triggers a lockout.
 */
export function recordFailedAttempt(key: string = 'default'): number {
  const record = getAttempts(key);
  record.count += 1;
  record.lastAttempt = Date.now();

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }

  setAttempts(record, key);
  return record.count;
}

/**
 * Clear all failed attempts (call on successful login).
 */
export function clearAttempts(key: string = 'default'): void {
  setAttempts({ count: 0, lastAttempt: 0, lockedUntil: null }, key);
}

/**
 * Get a human-readable message about the lockout status.
 */
export function getLockoutMessage(key: string = 'default'): string | null {
  const seconds = getSecondsUntilUnlock(key);
  if (seconds <= 0) return null;

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (minutes > 0) {
    return `Too many failed attempts. Please try again in ${minutes}m ${secs}s.`;
  }
  return `Too many failed attempts. Please try again in ${secs}s.`;
}

/**
 * Get the number of remaining attempts before lockout.
 */
export function getRemainingAttempts(key: string = 'default'): number {
  const record = getAttempts(key);
  return Math.max(0, MAX_ATTEMPTS - record.count);
}
