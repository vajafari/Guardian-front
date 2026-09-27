import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { BUILDING_PARKING_SPOT_ENDPOINTS } from './config';
import { BuildingParkingSpotError, type BuildingParkingSpotPayload } from '../types/buildingParkingSpot';

function mapBuildingParkingSpotError(err: unknown): BuildingParkingSpotError {
  if (!(err instanceof AxiosError)) {
    return new BuildingParkingSpotError('unknown');
  }
  if (!err.response) {
    return new BuildingParkingSpotError('network-error');
  }
  return new BuildingParkingSpotError('unknown');
}

export async function addBuildingParkingSpot(payload: BuildingParkingSpotPayload): Promise<void> {
  if (!payload.title.trim() || !payload.parkingSpotNumber.trim()) {
    throw new BuildingParkingSpotError('missing-fields');
  }

  try {
    await httpClient.post(BUILDING_PARKING_SPOT_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapBuildingParkingSpotError(err);
  }
}

export async function updateBuildingParkingSpot(payload: BuildingParkingSpotPayload): Promise<void> {
  if (!payload.title.trim() || !payload.parkingSpotNumber.trim()) {
    throw new BuildingParkingSpotError('missing-fields');
  }

  try {
    await httpClient.post(BUILDING_PARKING_SPOT_ENDPOINTS.update, payload);
  } catch (err) {
    throw mapBuildingParkingSpotError(err);
  }
}

export async function deleteBuildingParkingSpot(id: string): Promise<void> {
  try {
    await httpClient.post(BUILDING_PARKING_SPOT_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapBuildingParkingSpotError(err);
  }
}
