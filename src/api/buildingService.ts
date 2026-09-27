import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { BUILDING_ENDPOINTS } from './config';
import { BuildingError, type BuildingPayload, type Building } from '../types/building';
import type { BuildingFullInfo } from '../types/buildingFloor';

function mapBuildingError(err: unknown): BuildingError {
  if (!(err instanceof AxiosError)) {
    return new BuildingError('unknown');
  }
  if (!err.response) {
    return new BuildingError('network-error');
  }
  return new BuildingError('unknown');
}

export async function searchBuildings(): Promise<Building[]> {
  const { data } = await httpClient.post<Building[]>(BUILDING_ENDPOINTS.search, {});
  return data;
}

export async function addBuilding(payload: BuildingPayload): Promise<void> {
  if (!payload.title.trim() || payload.buildingNumber <= 0) {
    throw new BuildingError('missing-fields');
  }

  try {
    await httpClient.post(BUILDING_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapBuildingError(err);
  }
}

export async function updateBuilding(payload: BuildingPayload): Promise<void> {
  if (!payload.title.trim() || payload.buildingNumber <= 0) {
    throw new BuildingError('missing-fields');
  }

  try {
    await httpClient.post(BUILDING_ENDPOINTS.update, payload);
  } catch (err) {
    throw mapBuildingError(err);
  }
}

export async function deleteBuilding(id: string): Promise<void> {
  try {
    await httpClient.post(BUILDING_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapBuildingError(err);
  }
}

export async function getBuildingById(id: string): Promise<BuildingFullInfo | null> {
  const { data } = await httpClient.get<BuildingFullInfo | null>(BUILDING_ENDPOINTS.getById(id));
  return data ?? null;
}
