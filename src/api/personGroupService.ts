import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { PERSON_GROUP_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import {
  PersonGroupError,
  type PersonGroupDetail,
  type PersonGroupFullInfo,
  type PersonGroupPayload,
} from '../types/personGroup';

const PERSON_GROUP_STATUS_TITLE_MUST_BE_UNIQUE = 35000;
const PERSON_GROUP_STATUS_MUST_HAVE_TITLE = 35001;
const PERSON_GROUP_STATUS_NOT_FOUND = 35002;

/**
 * GridViewData rows come back PascalCase (unlike every other endpoint in this
 * app, which is camelCase) and use "" instead of null for empty nvarchar
 * fields — this maps that shape to the rest of the app's convention.
 */
export interface PersonGroupGridRow {
  Id: string;
  Title: string;
  Description: string;
  PersonCount: number;
}

function emptyToNull(value: string): string | null {
  return value === '' ? null : value;
}

export function mapPersonGroupGridRow(row: PersonGroupGridRow): PersonGroupFullInfo {
  return {
    id: row.Id,
    title: row.Title,
    description: emptyToNull(row.Description),
    personCount: row.PersonCount,
  };
}

function mapPersonGroupError(err: unknown): PersonGroupError {
  if (!(err instanceof AxiosError)) {
    return new PersonGroupError('unknown');
  }
  if (!err.response) {
    return new PersonGroupError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(PERSON_GROUP_STATUS_TITLE_MUST_BE_UNIQUE)) {
    return new PersonGroupError('title-already-exists');
  }
  if (errorCodes.includes(PERSON_GROUP_STATUS_MUST_HAVE_TITLE)) {
    return new PersonGroupError('title-invalid');
  }
  if (errorCodes.includes(PERSON_GROUP_STATUS_NOT_FOUND)) {
    return new PersonGroupError('not-found');
  }
  return new PersonGroupError('unknown');
}

export async function getPersonGroupById(id: string): Promise<PersonGroupDetail | null> {
  const { data } = await httpClient.get<PersonGroupDetail | null>(PERSON_GROUP_ENDPOINTS.getById(id));
  return data ?? null;
}

export async function addPersonGroup(payload: PersonGroupPayload): Promise<void> {
  if (!payload.title.trim()) {
    throw new PersonGroupError('missing-fields');
  }

  try {
    await httpClient.post(PERSON_GROUP_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapPersonGroupError(err);
  }
}

export async function updatePersonGroup(payload: PersonGroupPayload): Promise<void> {
  if (!payload.title.trim()) {
    throw new PersonGroupError('missing-fields');
  }

  try {
    await httpClient.post(PERSON_GROUP_ENDPOINTS.update, payload);
  } catch (err) {
    throw mapPersonGroupError(err);
  }
}

export async function deletePersonGroup(id: string): Promise<void> {
  try {
    await httpClient.post(PERSON_GROUP_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapPersonGroupError(err);
  }
}
