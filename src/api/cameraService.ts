import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { CAMERA_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { CameraError, type CameraFullInfo, type CameraPayload } from '../types/camera';

const CAMERA_STATUS_NOT_FOUND = 13600;
const CAMERA_STATUS_TITLE_IS_NOT_VALID = 13601;
const CAMERA_STATUS_IP_ADDRESS_IS_NOT_VALID = 13602;
const CAMERA_STATUS_PORT_IS_NOT_VALID = 13603;
const CAMERA_STATUS_CAMERA_TASK_IS_NOT_VALID = 13604;
const LOCATION_STATUS_LOCATION_NOT_FOUND = 13005;

/**
 * GridViewData rows come back PascalCase (unlike every other endpoint in this
 * app, which is camelCase) and use "" instead of null for empty nvarchar
 * fields — same convention as DeviceGridRow.
 */
export interface CameraGridRow {
  Id: string;
  Title: string;
  IpAddress: string;
  Port: number;
  UserName: string;
  Password: string;
  CameraProducer: number;
  CameraTask: number;
  RtspString: string;
  ApiBasicAuthUsername: string;
  ApiBasicAuthPassword: string;
  LocationId: string;
  IoType: number;
  ModuleId: number;
  IsActive: boolean;
  LocationNumber: number;
  LocationTitle: string;
}

function emptyToNull(value: string): string | null {
  return value === '' ? null : value;
}

export function mapCameraGridRow(row: CameraGridRow): CameraFullInfo {
  return {
    id: row.Id,
    title: row.Title,
    ipAddress: row.IpAddress,
    port: row.Port,
    userName: row.UserName,
    password: row.Password,
    cameraProducer: row.CameraProducer as CameraFullInfo['cameraProducer'],
    cameraTask: row.CameraTask as CameraFullInfo['cameraTask'],
    rtspString: emptyToNull(row.RtspString),
    apiBasicAuthUsername: emptyToNull(row.ApiBasicAuthUsername),
    apiBasicAuthPassword: emptyToNull(row.ApiBasicAuthPassword),
    locationId: row.LocationId,
    ioType: row.IoType as CameraFullInfo['ioType'],
    moduleId: row.ModuleId,
    isActive: row.IsActive,
    locationNumber: row.LocationNumber,
    locationTitle: row.LocationTitle,
  };
}

function mapCameraError(err: unknown): CameraError {
  if (!(err instanceof AxiosError)) {
    return new CameraError('unknown');
  }
  if (!err.response) {
    return new CameraError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(CAMERA_STATUS_TITLE_IS_NOT_VALID)) {
    return new CameraError('title-invalid');
  }
  if (errorCodes.includes(CAMERA_STATUS_IP_ADDRESS_IS_NOT_VALID)) {
    return new CameraError('ip-invalid');
  }
  if (errorCodes.includes(CAMERA_STATUS_PORT_IS_NOT_VALID)) {
    return new CameraError('port-invalid');
  }
  if (errorCodes.includes(CAMERA_STATUS_CAMERA_TASK_IS_NOT_VALID)) {
    return new CameraError('camera-task-invalid');
  }
  if (errorCodes.includes(LOCATION_STATUS_LOCATION_NOT_FOUND)) {
    return new CameraError('location-not-found');
  }
  if (errorCodes.includes(CAMERA_STATUS_NOT_FOUND)) {
    return new CameraError('not-found');
  }
  return new CameraError('unknown');
}

export async function saveCamera(payload: CameraPayload, isEdit: boolean): Promise<void> {
  if (!payload.title.trim() || !payload.ipAddress.trim() || payload.port <= 0 || !payload.locationId) {
    throw new CameraError('missing-fields');
  }

  try {
    await httpClient.post(CAMERA_ENDPOINTS.save(isEdit ? 1 : 0), payload);
  } catch (err) {
    throw mapCameraError(err);
  }
}

export async function deleteCamera(id: string): Promise<void> {
  try {
    await httpClient.post(CAMERA_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapCameraError(err);
  }
}
