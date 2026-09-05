export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  securityImage: string;
}

/**
 * POST /api/core/Account/ChangePasswordOnForceChangeByUser — used pre-login,
 * when the backend rejects sign-in because the password expired. No auth
 * token exists yet, so the username is supplied explicitly. `securityImage`
 * is optional per the API schema (unlike ChangePasswordPayload), which
 * matters because GET /api/Captcha/CaptchaImage itself requires a bearer
 * token the user doesn't have yet — see LoginPage's captcha handling.
 */
export interface ForceChangePasswordPayload {
  username: string;
  oldPassword: string;
  newPassword: string;
  securityImage: string;
}

export type ChangePasswordErrorCode =
  | 'missing-fields'
  | 'passwords-do-not-match'
  | 'invalid-old-password'
  | 'invalid-captcha'
  | 'network-error'
  | 'unknown';

export class ChangePasswordError extends Error {
  code: ChangePasswordErrorCode;

  constructor(code: ChangePasswordErrorCode) {
    super(code);
    this.code = code;
    this.name = 'ChangePasswordError';
  }
}
