export interface ChangePasswordPayload {
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
