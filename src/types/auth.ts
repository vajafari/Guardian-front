export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  username: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export type AuthErrorCode = 'missing-credentials' | 'invalid-credentials' | 'unknown';

export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode) {
    super(code);
    this.code = code;
    this.name = 'AuthError';
  }
}
