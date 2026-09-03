export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  userId: string;
  entityTitle: string;
}

/** Raw shape returned by POST /api/core/Auth/Token and /api/core/Auth/RefreshToken. */
export interface AuthTokenResponse {
  token: string;
  refreshToken: string;
  entityTitle: string;
  isOtpRequired: boolean;
}

export interface LoginResult {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

export type AuthErrorCode =
  | 'missing-credentials'
  | 'invalid-credentials'
  | 'otp-required'
  | 'network-error'
  | 'unknown';

export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode) {
    super(code);
    this.code = code;
    this.name = 'AuthError';
  }
}
