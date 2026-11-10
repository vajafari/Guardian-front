import { httpClient } from './httpClient';
import { DEVICE_TYPE_ENDPOINTS } from './config';
import type { DeviceType } from '../types/device';

/** GET /api/core/DeviceType/GetAllDeviceTypes — a fixed backend catalog, read-only. */
export async function listDeviceTypes(): Promise<DeviceType[]> {
  const { data } = await httpClient.get<DeviceType[]>(DEVICE_TYPE_ENDPOINTS.getAll);
  return data;
}
