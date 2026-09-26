import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { PERSON_ENDPOINTS } from './config';
import {
  PersonError,
  type PersonActivateRequest,
  type PersonFullInfo,
  type PersonInactivateRequest,
  type PersonPayload,
  type PersonSummary,
} from '../types/person';

export interface SearchPersonsOptions {
  itemsPerPage?: number;
  isActive?: boolean;
}

function encodeSearchQuery(text: string): string {
  if (!text) {
    return '';
  }
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export async function searchPersonsByFullName(
  query: string,
  { itemsPerPage = 50, isActive = true }: SearchPersonsOptions = {},
): Promise<PersonSummary[]> {
  const { data } = await httpClient.get<PersonSummary[]>(
    PERSON_ENDPOINTS.searchSummaryByFullName(itemsPerPage, isActive ? 1 : 0),
    { params: { q: encodeSearchQuery(query) } },
  );
  return data;
}

export async function getFirstUnusedPersonNumberOnDevice(): Promise<number> {
  const { data } = await httpClient.get<number>(PERSON_ENDPOINTS.getFirstUnusedPersonNumberOnDevice);
  return data;
}

export async function getPersonById(id: string): Promise<PersonFullInfo | null> {
  const searchParams = new URLSearchParams();
  searchParams.append('Ids', id);
  const { data } = await httpClient.get<PersonFullInfo | null>(
    `${PERSON_ENDPOINTS.getById}?${searchParams.toString()}`,
  );
  return data ?? null;
}

function mapPersonError(err: unknown): PersonError {
  if (!(err instanceof AxiosError)) {
    return new PersonError('unknown');
  }
  if (!err.response) {
    return new PersonError('network-error');
  }
  return new PersonError('unknown');
}

export async function addPerson(payload: PersonPayload): Promise<void> {
  if (!payload.firstName.trim() || !payload.lastName.trim()) {
    throw new PersonError('missing-fields');
  }

  try {
    await httpClient.post(PERSON_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapPersonError(err);
  }
}

export async function updatePerson(payload: PersonPayload): Promise<void> {
  if (!payload.firstName.trim() || !payload.lastName.trim()) {
    throw new PersonError('missing-fields');
  }

  try {
    await httpClient.post(PERSON_ENDPOINTS.update, payload);
  } catch (err) {
    throw mapPersonError(err);
  }
}

export async function activatePerson(payload: PersonActivateRequest): Promise<void> {
  try {
    await httpClient.post(PERSON_ENDPOINTS.activate, payload);
  } catch (err) {
    throw mapPersonError(err);
  }
}

export async function inactivatePerson(payload: PersonInactivateRequest): Promise<void> {
  if (!payload.reasonOfInactive.trim()) {
    throw new PersonError('missing-fields');
  }

  try {
    await httpClient.post(PERSON_ENDPOINTS.inactivate, payload);
  } catch (err) {
    throw mapPersonError(err);
  }
}
