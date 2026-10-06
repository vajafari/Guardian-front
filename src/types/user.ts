export interface User {
  id: string;
  userGroupId: string;
  username: string;
  isSystemAdmin: boolean;
  isActive: boolean;
  expireDate: string | null;
  personId: string;
}

/** POST /api/core/Account/Save/{forceLogoutOnUserChange} body — same endpoint for add and edit. */
export interface UserPayload {
  id: string;
  userGroupId: string;
  username: string;
  /** Leave empty on edit to keep the current password. */
  password: string;
  isSystemAdmin: boolean;
  isActive: boolean;
  expireDate: string | null;
  personId: string;
}

export type UserErrorCode =
  | 'missing-fields'
  | 'username-not-unique'
  | 'password-invalid'
  | 'last-admin'
  | 'network-error'
  | 'unknown';

export class UserError extends Error {
  code: UserErrorCode;

  constructor(code: UserErrorCode) {
    super(code);
    this.code = code;
    this.name = 'UserError';
  }
}
