import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { BUILDING_STORAGE_ROOM_ENDPOINTS } from './config';
import { BuildingStorageRoomError, type BuildingStorageRoomPayload } from '../types/buildingStorageRoom';

function mapBuildingStorageRoomError(err: unknown): BuildingStorageRoomError {
  if (!(err instanceof AxiosError)) {
    return new BuildingStorageRoomError('unknown');
  }
  if (!err.response) {
    return new BuildingStorageRoomError('network-error');
  }
  return new BuildingStorageRoomError('unknown');
}

export async function addBuildingStorageRoom(payload: BuildingStorageRoomPayload): Promise<void> {
  if (!payload.title.trim() || !payload.storageRoomNumber.trim()) {
    throw new BuildingStorageRoomError('missing-fields');
  }

  try {
    await httpClient.post(BUILDING_STORAGE_ROOM_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapBuildingStorageRoomError(err);
  }
}

export async function updateBuildingStorageRoom(payload: BuildingStorageRoomPayload): Promise<void> {
  if (!payload.title.trim() || !payload.storageRoomNumber.trim()) {
    throw new BuildingStorageRoomError('missing-fields');
  }

  try {
    await httpClient.post(BUILDING_STORAGE_ROOM_ENDPOINTS.update, payload);
  } catch (err) {
    throw mapBuildingStorageRoomError(err);
  }
}

export async function deleteBuildingStorageRoom(id: string): Promise<void> {
  try {
    await httpClient.post(BUILDING_STORAGE_ROOM_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapBuildingStorageRoomError(err);
  }
}
