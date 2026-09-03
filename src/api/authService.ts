import type { LoginCredentials, LoginResponse } from '../types/auth';

const MOCK_LATENCY_MS = 600;

function base64UrlEncode(value: object): string {
  const json = JSON.stringify(value);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createMockJwt(username: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = {
    sub: username,
    name: username,
    iat: nowSeconds,
    exp: nowSeconds + 60 * 60,
  };
  return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.mock-signature`;
}

/**
 * Mock implementation — replace with a real HTTP call (e.g. `fetch('/api/auth/login', ...)`)
 * once a backend is available. Keeps the same signature so callers won't need to change.
 */
export function login({ username, password }: LoginCredentials): Promise<LoginResponse> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!username.trim() || !password.trim()) {
        reject(new Error('نام کاربری و رمز عبور الزامی است'));
        return;
      }
      if (password.length < 4) {
        reject(new Error('نام کاربری یا رمز عبور اشتباه است'));
        return;
      }
      resolve({
        token: createMockJwt(username),
        user: { username },
      });
    }, MOCK_LATENCY_MS);
  });
}
