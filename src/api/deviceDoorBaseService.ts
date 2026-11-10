import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { DEVICE_DOOR_BASE_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { DeviceDoorBaseError, type DeviceDoorBaseFullInfo, type DeviceDoorBasePayload } from '../types/deviceDoorBase';

const DEVICE_STATUS_DOOR_MUST_HAVE_TITLE = 13509;
const DEVICE_STATUS_DOOR_NUMBER_IS_NOT_VALID = 13510;
const DEVICE_STATUS_DEVICE_DOOR_NOT_FOUND = 13519;
const DEVICE_STATUS_DOOR_NUMBER_MUST_BE_UNIQUE = 13539;
const DEVICE_STATUS_DEVICE_DOOR_READER_IS_NOT_VALID = 13542;

function mapDeviceDoorBaseError(err: unknown): DeviceDoorBaseError {
  if (!(err instanceof AxiosError)) {
    return new DeviceDoorBaseError('unknown');
  }
  if (!err.response) {
    return new DeviceDoorBaseError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(DEVICE_STATUS_DOOR_MUST_HAVE_TITLE)) {
    return new DeviceDoorBaseError('title-invalid');
  }
  if (errorCodes.includes(DEVICE_STATUS_DOOR_NUMBER_IS_NOT_VALID)) {
    return new DeviceDoorBaseError('number-invalid');
  }
  if (errorCodes.includes(DEVICE_STATUS_DEVICE_DOOR_NOT_FOUND)) {
    return new DeviceDoorBaseError('not-found');
  }
  if (errorCodes.includes(DEVICE_STATUS_DOOR_NUMBER_MUST_BE_UNIQUE)) {
    return new DeviceDoorBaseError('number-already-exists');
  }
  if (errorCodes.includes(DEVICE_STATUS_DEVICE_DOOR_READER_IS_NOT_VALID)) {
    return new DeviceDoorBaseError('reader-invalid');
  }
  return new DeviceDoorBaseError('unknown');
}

export async function searchDeviceDoorsByDevice(deviceId: string): Promise<DeviceDoorBaseFullInfo[]> {
  const { data } = await httpClient.post<DeviceDoorBaseFullInfo[]>(DEVICE_DOOR_BASE_ENDPOINTS.searchFullInfo, {
    filter: { deviceIds: [deviceId] },
  });
  return data;
}

export async function saveDeviceDoorBase(payload: DeviceDoorBasePayload, isEdit: boolean): Promise<void> {
  if (!payload.title.trim() || payload.doorNumber <= 0 || !payload.readerDeviceId) {
    throw new DeviceDoorBaseError('missing-fields');
  }

  try {
    await httpClient.post(DEVICE_DOOR_BASE_ENDPOINTS.save(isEdit ? 1 : 0), payload);
  } catch (err) {
    throw mapDeviceDoorBaseError(err);
  }
}

export async function deleteDeviceDoorBase(id: string): Promise<void> {
  try {
    await httpClient.post(DEVICE_DOOR_BASE_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapDeviceDoorBaseError(err);
  }
}
