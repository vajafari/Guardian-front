import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { BUILDING_SPACE_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import {
  BuildingSpaceError,
  type BuildingSpace,
  type BuildingSpaceFullInfo,
  type BuildingSpacePayload,
  type BuildingSpaceSearchFilter,
} from '../types/buildingSpace';

const BUILDING_STATUS_BUILDING_SPACE_TITLE_IS_NOT_VALID = 4508;
const BUILDING_STATUS_BUILDING_SPACE_NUMBER_IS_NOT_VALID = 4509;
const BUILDING_STATUS_BUILDING_SPACE_NOT_FOUND = 4510;
const BUILDING_STATUS_BUILDING_SPACE_BUILDING_IS_REQUIRED = 4511;
const BUILDING_STATUS_BUILDING_SPACE_TYPE_IS_NOT_VALID = 4512;
const BUILDING_STATUS_BUILDING_SPACE_NATURE_IS_NOT_VALID = 4513;
const BUILDING_STATUS_BUILDING_SPACE_NUMBER_ALREADY_EXIST_IN_BUILDING = 4514;
const BUILDING_STATUS_BUILDING_SPACE_FLOOR_DOES_NOT_BELONG_TO_BUILDING = 4515;
const BUILDING_STATUS_BUILDING_SPACE_OWNER_UNIT_DOES_NOT_BELONG_TO_BUILDING = 4516;
const BUILDING_STATUS_BUILDING_SPACE_OWNER_UNIT_IS_ONLY_ALLOWED_FOR_EXCLUSIVE_SPACE = 4517;
const BUILDING_STATUS_BUILDING_SPACE_IS_CHARGEABLE_IS_ONLY_ALLOWED_FOR_EXCLUSIVE_SPACE = 4518;
const BUILDING_STATUS_BUILDING_SPACE_IS_RESERVABLE_IS_ONLY_ALLOWED_FOR_SHARED_SPACE = 4519;
const BUILDING_STATUS_BUILDING_SPACE_AREA_IS_NOT_VALID = 4520;
const BUILDING_STATUS_BUILDING_SPACE_CAPACITY_IS_NOT_VALID = 4521;

/**
 * GridViewData rows come back PascalCase (unlike every other endpoint in this
 * app, which is camelCase) and use "" instead of null for empty nvarchar
 * fields — this maps that shape to the rest of the app's convention.
 */
export interface BuildingSpaceGridRow {
  Id: string;
  BuildingId: string;
  BuildingFloorId: string | null;
  OwnerBuildingUnitId: string | null;
  SpaceType: number;
  SpaceNature: number;
  SpaceNumber: string;
  Title: string;
  Area: number | null;
  Capacity: number | null;
  IsChargeable: boolean;
  IsReservable: boolean;
  LocationId: string | null;
  IsActive: boolean;
  Description: string;
  BuildingTitle: string;
  BuildingNumber: number;
  BuildingFloorTitle: string;
  OwnerBuildingUnitTitle: string;
  LocationTitle: string;
}

function emptyToNull(value: string): string | null {
  return value === '' ? null : value;
}

export function mapBuildingSpaceGridRow(row: BuildingSpaceGridRow): BuildingSpaceFullInfo {
  return {
    id: row.Id,
    buildingId: row.BuildingId,
    buildingFloorId: row.BuildingFloorId,
    ownerBuildingUnitId: row.OwnerBuildingUnitId,
    spaceType: row.SpaceType as BuildingSpaceFullInfo['spaceType'],
    spaceNature: row.SpaceNature as BuildingSpaceFullInfo['spaceNature'],
    spaceNumber: row.SpaceNumber,
    title: row.Title,
    area: row.Area,
    capacity: row.Capacity,
    isChargeable: row.IsChargeable,
    isReservable: row.IsReservable,
    locationId: row.LocationId,
    isActive: row.IsActive,
    description: emptyToNull(row.Description),
    buildingTitle: row.BuildingTitle,
    buildingNumber: row.BuildingNumber,
    buildingFloorTitle: emptyToNull(row.BuildingFloorTitle),
    ownerBuildingUnitTitle: emptyToNull(row.OwnerBuildingUnitTitle),
    locationTitle: emptyToNull(row.LocationTitle),
  };
}

function mapBuildingSpaceError(err: unknown): BuildingSpaceError {
  if (!(err instanceof AxiosError)) {
    return new BuildingSpaceError('unknown');
  }
  if (!err.response) {
    return new BuildingSpaceError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(BUILDING_STATUS_BUILDING_SPACE_TITLE_IS_NOT_VALID)) {
    return new BuildingSpaceError('title-invalid');
  }
  if (errorCodes.includes(BUILDING_STATUS_BUILDING_SPACE_NUMBER_IS_NOT_VALID)) {
    return new BuildingSpaceError('number-invalid');
  }
  if (errorCodes.includes(BUILDING_STATUS_BUILDING_SPACE_NOT_FOUND)) {
    return new BuildingSpaceError('not-found');
  }
  if (errorCodes.includes(BUILDING_STATUS_BUILDING_SPACE_BUILDING_IS_REQUIRED)) {
    return new BuildingSpaceError('building-required');
  }
  if (errorCodes.includes(BUILDING_STATUS_BUILDING_SPACE_TYPE_IS_NOT_VALID)) {
    return new BuildingSpaceError('type-invalid');
  }
  if (errorCodes.includes(BUILDING_STATUS_BUILDING_SPACE_NATURE_IS_NOT_VALID)) {
    return new BuildingSpaceError('nature-invalid');
  }
  if (errorCodes.includes(BUILDING_STATUS_BUILDING_SPACE_NUMBER_ALREADY_EXIST_IN_BUILDING)) {
    return new BuildingSpaceError('number-already-exists');
  }
  if (errorCodes.includes(BUILDING_STATUS_BUILDING_SPACE_FLOOR_DOES_NOT_BELONG_TO_BUILDING)) {
    return new BuildingSpaceError('floor-not-in-building');
  }
  if (errorCodes.includes(BUILDING_STATUS_BUILDING_SPACE_OWNER_UNIT_DOES_NOT_BELONG_TO_BUILDING)) {
    return new BuildingSpaceError('owner-unit-not-in-building');
  }
  if (errorCodes.includes(BUILDING_STATUS_BUILDING_SPACE_OWNER_UNIT_IS_ONLY_ALLOWED_FOR_EXCLUSIVE_SPACE)) {
    return new BuildingSpaceError('owner-unit-only-for-exclusive');
  }
  if (errorCodes.includes(BUILDING_STATUS_BUILDING_SPACE_IS_CHARGEABLE_IS_ONLY_ALLOWED_FOR_EXCLUSIVE_SPACE)) {
    return new BuildingSpaceError('chargeable-only-for-exclusive');
  }
  if (errorCodes.includes(BUILDING_STATUS_BUILDING_SPACE_IS_RESERVABLE_IS_ONLY_ALLOWED_FOR_SHARED_SPACE)) {
    return new BuildingSpaceError('reservable-only-for-shared');
  }
  if (errorCodes.includes(BUILDING_STATUS_BUILDING_SPACE_AREA_IS_NOT_VALID)) {
    return new BuildingSpaceError('area-invalid');
  }
  if (errorCodes.includes(BUILDING_STATUS_BUILDING_SPACE_CAPACITY_IS_NOT_VALID)) {
    return new BuildingSpaceError('capacity-invalid');
  }
  return new BuildingSpaceError('unknown');
}

/** POST /api/core/BuildingSpace/Search — used for pickers (e.g. Contract's space target). */
export async function searchBuildingSpaces(filter: BuildingSpaceSearchFilter): Promise<BuildingSpace[]> {
  const { data } = await httpClient.post<BuildingSpace[]>(BUILDING_SPACE_ENDPOINTS.search, { filter });
  return data;
}

export async function addBuildingSpace(payload: BuildingSpacePayload): Promise<void> {
  if (!payload.buildingId || !payload.title.trim() || !payload.spaceNumber.trim()) {
    throw new BuildingSpaceError('missing-fields');
  }

  try {
    await httpClient.post(BUILDING_SPACE_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapBuildingSpaceError(err);
  }
}

export async function updateBuildingSpace(payload: BuildingSpacePayload): Promise<void> {
  if (!payload.buildingId || !payload.title.trim() || !payload.spaceNumber.trim()) {
    throw new BuildingSpaceError('missing-fields');
  }

  try {
    await httpClient.post(BUILDING_SPACE_ENDPOINTS.update, payload);
  } catch (err) {
    throw mapBuildingSpaceError(err);
  }
}

export async function deleteBuildingSpace(id: string): Promise<void> {
  try {
    await httpClient.post(BUILDING_SPACE_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapBuildingSpaceError(err);
  }
}
