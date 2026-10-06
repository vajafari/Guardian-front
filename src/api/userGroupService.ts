import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { USER_GROUP_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { UserGroupError, type UserGroup, type UserGroupFullInfo, type UserGroupPayload } from '../types/userGroup';

const ACCOUNTING_STATUS_USER_GROUP_TITLE_IS_NOT_VALID = 1032;
const ACCOUNTING_STATUS_MAX_CONCURRENT_SESSIONS_IS_NOT_VALID = 1036;
const ACCOUNTING_STATUS_CIDR_IS_NOT_VALID = 1038;
const ACCOUNTING_STATUS_CANNOT_DELETE_USER_GROUP_WITH_USERS = 1061;
const ACCOUNTING_STATUS_CANNOT_DELETE_USER_GROUP_WITH_RELATED_DATA = 1062;

function mapUserGroupError(err: unknown): UserGroupError {
  if (!(err instanceof AxiosError)) {
    return new UserGroupError('unknown');
  }
  if (!err.response) {
    return new UserGroupError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(ACCOUNTING_STATUS_USER_GROUP_TITLE_IS_NOT_VALID)) {
    return new UserGroupError('title-invalid');
  }
  if (errorCodes.includes(ACCOUNTING_STATUS_MAX_CONCURRENT_SESSIONS_IS_NOT_VALID)) {
    return new UserGroupError('max-sessions-invalid');
  }
  if (errorCodes.includes(ACCOUNTING_STATUS_CIDR_IS_NOT_VALID)) {
    return new UserGroupError('cidr-invalid');
  }
  if (errorCodes.includes(ACCOUNTING_STATUS_CANNOT_DELETE_USER_GROUP_WITH_USERS)) {
    return new UserGroupError('has-users');
  }
  if (errorCodes.includes(ACCOUNTING_STATUS_CANNOT_DELETE_USER_GROUP_WITH_RELATED_DATA)) {
    return new UserGroupError('has-related-data');
  }
  return new UserGroupError('unknown');
}

export async function listUserGroups(): Promise<UserGroup[]> {
  const { data } = await httpClient.get<UserGroup[]>(USER_GROUP_ENDPOINTS.getAll);
  return data;
}

export async function getUserGroupById(id: string): Promise<UserGroupFullInfo> {
  const { data } = await httpClient.get<UserGroupFullInfo>(USER_GROUP_ENDPOINTS.getById(id));
  return data;
}

export async function addUserGroup(payload: UserGroupPayload): Promise<void> {
  if (!payload.title.trim() || payload.maxConcurrentSessions <= 0) {
    throw new UserGroupError('missing-fields');
  }

  try {
    await httpClient.post(USER_GROUP_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapUserGroupError(err);
  }
}

export async function updateUserGroup(payload: UserGroupPayload): Promise<void> {
  if (!payload.title.trim() || payload.maxConcurrentSessions <= 0) {
    throw new UserGroupError('missing-fields');
  }

  try {
    await httpClient.post(USER_GROUP_ENDPOINTS.update, payload);
  } catch (err) {
    throw mapUserGroupError(err);
  }
}

export async function deleteUserGroup(id: string): Promise<void> {
  try {
    await httpClient.post(USER_GROUP_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapUserGroupError(err);
  }
}
