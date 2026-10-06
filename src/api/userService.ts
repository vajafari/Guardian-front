import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { USER_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { UserError, type User, type UserPayload } from '../types/user';

/** Row shape from GET /api/core/Account/GridViewDataSummary (DtoUserFullInfo, PascalCase). */
export interface UserGridRow {
  Id: string;
  UserGroupId: string;
  Username: string;
  IsSystemAdmin: boolean;
  IsActive: boolean;
  ExpireDate: string;
  PersonId: string;
  FirstName: string;
  LastName: string;
  UserGroupTitle: string;
  IsValid: boolean;
}

const ACCOUNTING_STATUS_USERNAME_MUST_BE_UNIQUE = 1015;
const ACCOUNTING_STATUS_PASSWORD_IS_NOT_VALID = 1010;
const ACCOUNTING_STATUS_AT_LEAST_ONE_SYSTEM_ADMIN_MUST_EXIST = 1014;

function emptyToNull(value: string): string | null {
  return value === '' ? null : value;
}

export function mapUserGridRow(row: UserGridRow): User {
  return {
    id: row.Id,
    userGroupId: row.UserGroupId,
    username: row.Username,
    isSystemAdmin: row.IsSystemAdmin,
    isActive: row.IsActive,
    expireDate: emptyToNull(row.ExpireDate),
    personId: row.PersonId,
  };
}

function mapUserError(err: unknown): UserError {
  if (!(err instanceof AxiosError)) {
    return new UserError('unknown');
  }
  if (!err.response) {
    return new UserError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(ACCOUNTING_STATUS_USERNAME_MUST_BE_UNIQUE)) {
    return new UserError('username-not-unique');
  }
  if (errorCodes.includes(ACCOUNTING_STATUS_PASSWORD_IS_NOT_VALID)) {
    return new UserError('password-invalid');
  }
  if (errorCodes.includes(ACCOUNTING_STATUS_AT_LEAST_ONE_SYSTEM_ADMIN_MUST_EXIST)) {
    return new UserError('last-admin');
  }
  return new UserError('unknown');
}

export async function saveUser(payload: UserPayload, isEdit: boolean): Promise<void> {
  if (!payload.username.trim() || !payload.personId || !payload.userGroupId) {
    throw new UserError('missing-fields');
  }
  if (!isEdit && !payload.password.trim()) {
    throw new UserError('missing-fields');
  }

  try {
    await httpClient.post(USER_ENDPOINTS.save(0), payload);
  } catch (err) {
    throw mapUserError(err);
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await httpClient.post(USER_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapUserError(err);
  }
}
