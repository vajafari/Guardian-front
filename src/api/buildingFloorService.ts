import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { BUILDING_FLOOR_ENDPOINTS } from './config';
import { BuildingFloorError, type BuildingFloorFullInfo, type BuildingFloorPayload } from '../types/buildingFloor';

function mapBuildingFloorError(err: unknown): BuildingFloorError {
  if (!(err instanceof AxiosError)) {
    return new BuildingFloorError('unknown');
  }
  if (!err.response) {
    return new BuildingFloorError('network-error');
  }
  return new BuildingFloorError('unknown');
}

export async function addBuildingFloor(payload: BuildingFloorPayload): Promise<void> {
  if (!payload.title.trim()) {
    throw new BuildingFloorError('missing-fields');
  }

  try {
    await httpClient.post(BUILDING_FLOOR_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapBuildingFloorError(err);
  }
}

export async function updateBuildingFloor(payload: BuildingFloorPayload): Promise<void> {
  if (!payload.title.trim()) {
    throw new BuildingFloorError('missing-fields');
  }

  try {
    await httpClient.post(BUILDING_FLOOR_ENDPOINTS.update, payload);
  } catch (err) {
    throw mapBuildingFloorError(err);
  }
}

export async function deleteBuildingFloor(id: string): Promise<void> {
  try {
    await httpClient.post(BUILDING_FLOOR_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapBuildingFloorError(err);
  }
}

export async function getBuildingFloorById(id: string): Promise<BuildingFloorFullInfo | null> {
  const { data } = await httpClient.get<BuildingFloorFullInfo | null>(BUILDING_FLOOR_ENDPOINTS.getById(id));
  return data ?? null;
}
