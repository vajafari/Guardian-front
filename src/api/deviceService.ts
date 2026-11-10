import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { DEVICE_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { DeviceError, type DeviceFullInfo, type DevicePayload } from '../types/device';

const DEVICE_LIMIT = 33;
const DEVICE_STATUS_DEVICE_NUMBER_IS_NOT_VALID = 13500;
const DEVICE_STATUS_TITLE_IS_NOT_VALID = 13501;
const DEVICE_STATUS_DEVICE_IP_IS_NOT_VALID = 13502;
const DEVICE_STATUS_TCP_PORT_IS_NOT_VALID = 13503;
const DEVICE_STATUS_DEVICE_TYPE_NOT_FOUND_IN_DATABASE = 13506;
const DEVICE_STATUS_DEVICE_NOT_FOUND = 13507;
const DEVICE_STATUS_DEVICE_CONNECTION_MODE_IS_NOT_VALID = 13521;
const DEVICE_STATUS_SERIAL_NUMBER_MUST_BE_UNIQUE = 13541;

/**
 * GridViewData rows come back PascalCase (unlike every other endpoint in this
 * app, which is camelCase) and use "" instead of null for empty nvarchar
 * fields — this maps that shape to the rest of the app's convention.
 */
export interface DeviceGridRow {
  Id: string;
  DeviceNumber: number;
  DeviceTypeId: string;
  LocationId: string;
  Title: string;
  IsActive: boolean;
  SerialNumber: string;
  DevicePassword: string;
  ConnectionMode: number;
  DeviceIp: string;
  TcpPort: number;
  ConnectTimeout: number;
  ModuleId: number;
  IoType: number;
  TimeZone: number;
  DeviceDescription: string;
  DeviceTypeTitle: string;
  LocationNumber: number;
  LocationTitle: string;
}

function emptyToNull(value: string): string | null {
  return value === '' ? null : value;
}

export function mapDeviceGridRow(row: DeviceGridRow): DeviceFullInfo {
  return {
    id: row.Id,
    deviceNumber: row.DeviceNumber,
    deviceTypeId: row.DeviceTypeId,
    locationId: row.LocationId,
    title: row.Title,
    isActive: row.IsActive,
    serialNumber: emptyToNull(row.SerialNumber),
    devicePassword: emptyToNull(row.DevicePassword),
    connectionMode: row.ConnectionMode as DeviceFullInfo['connectionMode'],
    deviceIp: emptyToNull(row.DeviceIp),
    tcpPort: row.TcpPort,
    connectTimeout: row.ConnectTimeout,
    moduleId: row.ModuleId,
    ioType: row.IoType as DeviceFullInfo['ioType'],
    timeZone: row.TimeZone,
    deviceDescription: emptyToNull(row.DeviceDescription),
    deviceTypeTitle: row.DeviceTypeTitle,
    locationNumber: row.LocationNumber,
    locationTitle: row.LocationTitle,
  };
}

function mapDeviceError(err: unknown): DeviceError {
  if (!(err instanceof AxiosError)) {
    return new DeviceError('unknown');
  }
  if (!err.response) {
    return new DeviceError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(DEVICE_STATUS_DEVICE_NUMBER_IS_NOT_VALID)) {
    return new DeviceError('number-invalid');
  }
  if (errorCodes.includes(DEVICE_STATUS_TITLE_IS_NOT_VALID)) {
    return new DeviceError('title-invalid');
  }
  if (errorCodes.includes(DEVICE_STATUS_DEVICE_IP_IS_NOT_VALID)) {
    return new DeviceError('ip-invalid');
  }
  if (errorCodes.includes(DEVICE_STATUS_TCP_PORT_IS_NOT_VALID)) {
    return new DeviceError('tcp-port-invalid');
  }
  if (errorCodes.includes(DEVICE_STATUS_DEVICE_TYPE_NOT_FOUND_IN_DATABASE)) {
    return new DeviceError('device-type-not-found');
  }
  if (errorCodes.includes(DEVICE_STATUS_DEVICE_NOT_FOUND)) {
    return new DeviceError('not-found');
  }
  if (errorCodes.includes(DEVICE_STATUS_DEVICE_CONNECTION_MODE_IS_NOT_VALID)) {
    return new DeviceError('connection-mode-invalid');
  }
  if (errorCodes.includes(DEVICE_STATUS_SERIAL_NUMBER_MUST_BE_UNIQUE)) {
    return new DeviceError('serial-number-must-be-unique');
  }
  if (errorCodes.includes(DEVICE_LIMIT)) {
    return new DeviceError('device-limit-reached');
  }
  return new DeviceError('unknown');
}

/** No plain "search all" endpoint exists with normal admin auth — reuses GridViewData with a large page size. */
export async function listAllDevices(): Promise<DeviceFullInfo[]> {
  const { data } = await httpClient.get<{ rows: DeviceGridRow[] }>(DEVICE_ENDPOINTS.gridView, {
    params: { C: '', S: 'DeviceNumber¤1', P: 1, I: 1000 },
  });
  return data.rows.map(mapDeviceGridRow);
}

export async function getFirstUnusedDeviceNumber(): Promise<number> {
  const { data } = await httpClient.get<number>(DEVICE_ENDPOINTS.getFirstUnusedNumber);
  return data;
}

export async function getDeviceById(id: string): Promise<DeviceFullInfo | null> {
  const { data } = await httpClient.get<DeviceFullInfo | null>(DEVICE_ENDPOINTS.getById(id));
  return data ?? null;
}

export async function saveDevice(payload: DevicePayload, isEdit: boolean): Promise<void> {
  if (!payload.title.trim() || payload.deviceNumber <= 0 || !payload.deviceTypeId || !payload.locationId) {
    throw new DeviceError('missing-fields');
  }

  try {
    await httpClient.post(DEVICE_ENDPOINTS.save(isEdit ? 1 : 0), payload);
  } catch (err) {
    throw mapDeviceError(err);
  }
}

export async function deleteDevice(id: string): Promise<void> {
  try {
    await httpClient.post(DEVICE_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapDeviceError(err);
  }
}
