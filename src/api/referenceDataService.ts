import { httpClient } from './httpClient';
import { FIELD_OF_STUDY_ENDPOINTS, POSITION_ENDPOINTS } from './config';
import type { FieldOfStudy, Position } from '../types/referenceData';

export async function getFieldOfStudies(): Promise<FieldOfStudy[]> {
  const { data } = await httpClient.get<FieldOfStudy[]>(FIELD_OF_STUDY_ENDPOINTS.getAll);
  return data;
}

export async function getPositions(): Promise<Position[]> {
  const { data } = await httpClient.get<Position[]>(POSITION_ENDPOINTS.getAll);
  return data;
}
