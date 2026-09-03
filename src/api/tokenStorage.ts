import type { AuthUser } from '../types/auth';

const TOKEN_KEY = 'guardian.token';
const REFRESH_TOKEN_KEY = 'guardian.refreshToken';
const USER_KEY = 'guardian.user';

/** Dispatched when the interceptor gives up on a refresh and forces a logout. */
export const AUTH_SESSION_EXPIRED_EVENT = 'guardian:session-expired';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function setSession(session: { token: string; refreshToken: string; user: AuthUser }): void {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

/** Called by the response interceptor after a successful silent refresh. */
export function updateTokens(token: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Clears the session and lets AuthContext know outside of any React event handler. */
export function forceSessionExpired(): void {
  clearSession();
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
}
