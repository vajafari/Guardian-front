import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { FIELD_OF_STUDY_ADMIN_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { FieldOfStudyError, type FieldOfStudy, type FieldOfStudyPayload } from '../types/fieldOfStudy';

const FIELD_OF_STUDY_STATUS_TITLE_MUST_HAVE_TITLE = 3715;
const FIELD_OF_STUDY_STATUS_REQUEST_NOT_FOUND = 3716;

/** GridViewData row — PascalCase, same convention as every other GridView endpoint. */
export interface FieldOfStudyGridRow {
  Id: string;
  Title: string;
}

export function mapFieldOfStudyGridRow(row: FieldOfStudyGridRow): FieldOfStudy {
  return {
    id: row.Id,
    title: row.Title,
  };
}

function mapFieldOfStudyError(err: unknown): FieldOfStudyError {
  if (!(err instanceof AxiosError)) {
    return new FieldOfStudyError('unknown');
  }
  if (!err.response) {
    return new FieldOfStudyError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIELD_OF_STUDY_STATUS_TITLE_MUST_HAVE_TITLE)) {
    return new FieldOfStudyError('title-invalid');
  }
  if (errorCodes.includes(FIELD_OF_STUDY_STATUS_REQUEST_NOT_FOUND)) {
    return new FieldOfStudyError('not-found');
  }
  return new FieldOfStudyError('unknown');
}

export async function saveFieldOfStudy(payload: FieldOfStudyPayload, isEdit: boolean): Promise<void> {
  if (!payload.title.trim()) {
    throw new FieldOfStudyError('missing-fields');
  }

  try {
    await httpClient.post(isEdit ? FIELD_OF_STUDY_ADMIN_ENDPOINTS.update : FIELD_OF_STUDY_ADMIN_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapFieldOfStudyError(err);
  }
}

export async function deleteFieldOfStudy(id: string): Promise<void> {
  try {
    await httpClient.post(FIELD_OF_STUDY_ADMIN_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapFieldOfStudyError(err);
  }
}
