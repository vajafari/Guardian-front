import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { BUILDING_UNIT_ENDPOINTS } from './config';
import { BuildingUnitError, type BuildingUnitPayload } from '../types/buildingUnit';

function mapBuildingUnitError(err: unknown): BuildingUnitError {
  if (!(err instanceof AxiosError)) {
    return new BuildingUnitError('unknown');
  }
  if (!err.response) {
    return new BuildingUnitError('network-error');
  }
  return new BuildingUnitError('unknown');
}

export async function addBuildingUnit(payload: BuildingUnitPayload): Promise<void> {
  if (payload.title <= 0 || payload.buildingArea <= 0) {
    throw new BuildingUnitError('missing-fields');
  }

  try {
    await httpClient.post(BUILDING_UNIT_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapBuildingUnitError(err);
  }
}

export async function updateBuildingUnit(payload: BuildingUnitPayload): Promise<void> {
  if (payload.title <= 0 || payload.buildingArea <= 0) {
    throw new BuildingUnitError('missing-fields');
  }

  try {
    await httpClient.post(BUILDING_UNIT_ENDPOINTS.update, payload);
  } catch (err) {
    throw mapBuildingUnitError(err);
  }
}

export async function deleteBuildingUnit(id: string): Promise<void> {
  try {
    await httpClient.post(BUILDING_UNIT_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapBuildingUnitError(err);
  }
}
