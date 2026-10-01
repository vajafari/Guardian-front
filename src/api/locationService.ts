import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { LOCATION_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { LocationError, type Location, type LocationPayload } from '../types/location';

const LOCATION_NUMBER_ALREADY_EXISTS = 13001;
const LOCATION_PARENT_CAN_NOT_BE_IN_NODE_HIERARCHY = 13000;

function mapLocationError(err: unknown): LocationError {
  if (!(err instanceof AxiosError)) {
    return new LocationError('unknown');
  }
  if (!err.response) {
    return new LocationError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(LOCATION_NUMBER_ALREADY_EXISTS)) {
    return new LocationError('number-already-exists');
  }
  if (errorCodes.includes(LOCATION_PARENT_CAN_NOT_BE_IN_NODE_HIERARCHY)) {
    return new LocationError('parent-cycle');
  }
  return new LocationError('unknown');
}

export async function listLocations(): Promise<Location[]> {
  const { data } = await httpClient.get<Location[]>(LOCATION_ENDPOINTS.getAll);
  return data;
}

export async function addLocation(payload: LocationPayload): Promise<void> {
  if (!payload.title.trim() || payload.locationNumber <= 0) {
    throw new LocationError('missing-fields');
  }

  try {
    await httpClient.post(LOCATION_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapLocationError(err);
  }
}

export async function updateLocation(payload: LocationPayload): Promise<void> {
  if (!payload.title.trim() || payload.locationNumber <= 0) {
    throw new LocationError('missing-fields');
  }

  try {
    await httpClient.post(LOCATION_ENDPOINTS.update, payload);
  } catch (err) {
    throw mapLocationError(err);
  }
}
