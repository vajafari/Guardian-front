import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { ELEVATOR_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { ElevatorError, type Elevator, type ElevatorFullInfo, type ElevatorPayload } from '../types/elevator';

const ELEVATOR_STATUS_NOT_FOUND = 33500;
const ELEVATOR_STATUS_NUMBER_IS_NOT_VALID = 33501;
const ELEVATOR_STATUS_TITLE_IS_NOT_VALID = 33502;
const ELEVATOR_STATUS_FLOORS_IS_NOT_VALID = 33503;
const ELEVATOR_STATUS_FLOOR_TITLE_IS_NOT_VALID = 33504;
const ELEVATOR_STATUS_FLOOR_NUMBER_MUST_BE_UNIQUE = 33505;

/**
 * GridViewData rows come back PascalCase (unlike every other endpoint in this
 * app, which is camelCase) and use "" instead of null for empty nvarchar
 * fields — this maps that shape to the rest of the app's convention.
 */
export interface ElevatorGridRow {
  Id: string;
  Title: string;
  BuildingId: string;
  FloorCount: number;
  LocationId: string;
  ValidFloorsInJsonFormat: string;
  BuildingTitle: string;
  LocationNumber: number;
  LocationTitle: string;
}

function emptyToNull(value: string): string | null {
  return value === '' ? null : value;
}

function parseValidFloors(json: string): number[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((v): v is number => typeof v === 'number') : [];
  } catch {
    return [];
  }
}

export function mapElevatorGridRow(row: ElevatorGridRow): ElevatorFullInfo {
  return {
    id: row.Id,
    title: row.Title,
    buildingId: row.BuildingId,
    floorCount: row.FloorCount,
    locationId: row.LocationId,
    validFloors: parseValidFloors(row.ValidFloorsInJsonFormat),
    elevatorFloors: [],
    buildingTitle: row.BuildingTitle,
    locationNumber: row.LocationNumber,
    locationTitle: emptyToNull(row.LocationTitle) ?? '',
  };
}

function mapElevatorError(err: unknown): ElevatorError {
  if (!(err instanceof AxiosError)) {
    return new ElevatorError('unknown');
  }
  if (!err.response) {
    return new ElevatorError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(ELEVATOR_STATUS_NOT_FOUND)) {
    return new ElevatorError('not-found');
  }
  if (errorCodes.includes(ELEVATOR_STATUS_NUMBER_IS_NOT_VALID)) {
    return new ElevatorError('number-invalid');
  }
  if (errorCodes.includes(ELEVATOR_STATUS_TITLE_IS_NOT_VALID)) {
    return new ElevatorError('title-invalid');
  }
  if (errorCodes.includes(ELEVATOR_STATUS_FLOORS_IS_NOT_VALID)) {
    return new ElevatorError('floors-invalid');
  }
  if (errorCodes.includes(ELEVATOR_STATUS_FLOOR_TITLE_IS_NOT_VALID)) {
    return new ElevatorError('floor-title-invalid');
  }
  if (errorCodes.includes(ELEVATOR_STATUS_FLOOR_NUMBER_MUST_BE_UNIQUE)) {
    return new ElevatorError('floor-number-must-be-unique');
  }
  return new ElevatorError('unknown');
}

/** POST /api/core/Elevator/Search with IncludeElevatorFloors — used for the detail/edit load. */
export async function getElevatorById(id: string): Promise<Elevator | null> {
  const { data } = await httpClient.post<Elevator[]>(ELEVATOR_ENDPOINTS.search, {
    filter: { ids: [id] },
    includeElevatorFloors: true,
  });
  return data[0] ?? null;
}

export async function saveElevator(payload: ElevatorPayload, isEdit: boolean): Promise<void> {
  if (!payload.title.trim() || payload.floorCount <= 0 || !payload.buildingId || !payload.locationId) {
    throw new ElevatorError('missing-fields');
  }
  if (payload.elevatorFloors.length === 0 || payload.elevatorFloors.length > payload.floorCount) {
    throw new ElevatorError('floors-invalid');
  }

  try {
    await httpClient.post(ELEVATOR_ENDPOINTS.save(isEdit ? 1 : 0), payload);
  } catch (err) {
    throw mapElevatorError(err);
  }
}

export async function deleteElevator(id: string): Promise<void> {
  try {
    await httpClient.post(ELEVATOR_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapElevatorError(err);
  }
}

/** Floor-centric full replacement of the persons granted access to one ElevatorFloor. */
export async function saveElevatorFloorPersons(
  elevatorFloorId: string,
  personIds: string[],
  description: string | null,
): Promise<void> {
  try {
    await httpClient.post(ELEVATOR_ENDPOINTS.saveElevatorFloorPersons, { elevatorFloorId, personIds, description });
  } catch (err) {
    throw mapElevatorError(err);
  }
}
