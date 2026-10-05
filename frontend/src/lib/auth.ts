/**
 * Authentication management for Infinix Math.
 * In Phase 1, supports static authentication with credentials:
 * Username: 'admin'
 * Password: 'admin'
 * 
 * Future phases will integrate production OAuth (Google, Apple, Phone OTP).
 */

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'Administrator' | 'Student' | 'Educator';
  plan: 'Prime Pro' | 'Basic Pro' | 'Free';
  avatar?: string;
  createdAt: string;
}

const AUTH_STORAGE_KEY = 'infinix_auth_session';

export const STATIC_CREDENTIALS = {
  username: 'admin',
  password: 'admin',
};

export const DEFAULT_ADMIN_USER: AuthUser = {
  id: 'usr_admin_001',
  username: 'admin',
  email: 'admin@infinixmath.ai',
  name: 'Admin User',
  role: 'Administrator',
  plan: 'Prime Pro',
  createdAt: new Date().toISOString(),
};

/**
 * Validates credentials against the static auth configuration.
 */
export function validateStaticLogin(usernameInput: string, passwordInput: string): AuthUser | null {
  const cleanUsername = usernameInput.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  if (
    (cleanUsername === STATIC_CREDENTIALS.username || cleanUsername === 'admin@infinixmath.ai') &&
    cleanPassword === STATIC_CREDENTIALS.password
  ) {
    return DEFAULT_ADMIN_USER;
  }

  return null;
}

/**
 * Retrieves the currently persisted user session from localStorage.
 */
export function getStoredSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Persists an authenticated user session to localStorage.
 */
export function persistSession(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Clears the active session from localStorage.
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Checks whether an active authenticated session exists.
 */
export function isSessionActive(): boolean {
  return getStoredSession() !== null;
}
