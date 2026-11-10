import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { POSITION_ADMIN_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { PositionError, type Position, type PositionPayload } from '../types/position';

const POSITION_STATUS_NUMBER_ALREADY_EXISTS = 3000;
const POSITION_STATUS_MUST_HAVE_TITLE = 3001;
const POSITION_STATUS_NUMBER_IS_NOT_VALID = 3002;
const POSITION_STATUS_NOT_FOUND = 3003;

/** GridViewData row — PascalCase, same convention as every other GridView endpoint. */
export interface PositionGridRow {
  Id: string;
  PositionNumber: number;
  Title: string;
}

export function mapPositionGridRow(row: PositionGridRow): Position {
  return {
    id: row.Id,
    positionNumber: row.PositionNumber,
    title: row.Title,
  };
}

function mapPositionError(err: unknown): PositionError {
  if (!(err instanceof AxiosError)) {
    return new PositionError('unknown');
  }
  if (!err.response) {
    return new PositionError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(POSITION_STATUS_NUMBER_ALREADY_EXISTS)) {
    return new PositionError('number-already-exists');
  }
  if (errorCodes.includes(POSITION_STATUS_MUST_HAVE_TITLE)) {
    return new PositionError('title-invalid');
  }
  if (errorCodes.includes(POSITION_STATUS_NUMBER_IS_NOT_VALID)) {
    return new PositionError('number-invalid');
  }
  if (errorCodes.includes(POSITION_STATUS_NOT_FOUND)) {
    return new PositionError('not-found');
  }
  return new PositionError('unknown');
}

export async function getFirstUnusedPositionNumber(): Promise<number> {
  const { data } = await httpClient.get<number>(POSITION_ADMIN_ENDPOINTS.getFirstUnusedNumber);
  return data;
}

export async function savePosition(payload: PositionPayload, isEdit: boolean): Promise<void> {
  if (!payload.title.trim() || payload.positionNumber <= 0) {
    throw new PositionError('missing-fields');
  }

  try {
    await httpClient.post(isEdit ? POSITION_ADMIN_ENDPOINTS.update : POSITION_ADMIN_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapPositionError(err);
  }
}

export async function deletePosition(id: string): Promise<void> {
  try {
    await httpClient.post(POSITION_ADMIN_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapPositionError(err);
  }
}
