import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { CABINET_ROOM_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { CabinetRoomError, type CabinetRoom, type CabinetRoomFullInfo, type CabinetRoomPayload } from '../types/cabinetRoom';

const CABINET_ROOM_STATUS_TITLE_IS_NOT_VALID = 33701;
const CABINET_ROOM_STATUS_CABINET_CANNOT_BE_EMPTY = 33702;
const CABINET_ROOM_STATUS_CAPACITY_IS_NOT_VALID = 33703;
const CABINET_ROOM_STATUS_CABINET_NUMBER_IS_NOT_VALID = 33704;
const CABINET_ROOM_STATUS_CABINET_NUMBER_MUST_BE_UNIQUE = 33705;
const CABINET_ROOM_STATUS_NOT_FOUND = 33706;
const CABINET_ROOM_STATUS_CANNOT_ASSIGN_PERSON_TO_AUTO_ROOM = 33708;
const CABINET_ROOM_STATUS_CANNOT_USE_SHARED = 33709;
const LOCATION_STATUS_LOCATION_NOT_FOUND = 13005;

interface CabinetPersonApiRow {
  id: string;
  cabinetId: string;
  personId: string;
}

interface CabinetApiRow {
  id: string;
  cabinetRoomId: string;
  cabinetNumber: number;
  description: string | null;
  cabinetPersons: CabinetPersonApiRow[] | null;
}

interface CabinetRoomApiRow {
  id: string;
  title: string;
  description: string | null;
  capacity: number;
  isActive: boolean;
  isShared: boolean;
  isAuto: boolean;
  isMultiple: boolean;
  locationId: string;
  cabinets: CabinetApiRow[] | null;
}

function mapCabinetRoomApiRow(row: CabinetRoomApiRow): CabinetRoom {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    capacity: row.capacity,
    isActive: row.isActive,
    isShared: row.isShared,
    isAuto: row.isAuto,
    isMultiple: row.isMultiple,
    locationId: row.locationId,
    cabinets: (row.cabinets ?? []).map((cabinet) => ({
      id: cabinet.id,
      cabinetRoomId: cabinet.cabinetRoomId,
      cabinetNumber: cabinet.cabinetNumber,
      description: cabinet.description,
      personIds: (cabinet.cabinetPersons ?? []).map((cp) => cp.personId),
    })),
  };
}

/**
 * GridViewData rows come back PascalCase (unlike every other endpoint in this
 * app, which is camelCase) and use "" instead of null for empty nvarchar
 * fields — same convention as every other GridView row.
 */
export interface CabinetRoomGridRow {
  Id: string;
  Title: string;
  Description: string;
  Capacity: number;
  IsActive: boolean;
  IsShared: boolean;
  IsAuto: boolean;
  IsMultiple: boolean;
  LocationId: string;
  LocationNumber: number;
  LocationTitle: string;
}

function emptyToNull(value: string): string | null {
  return value === '' ? null : value;
}

export function mapCabinetRoomGridRow(row: CabinetRoomGridRow): CabinetRoomFullInfo {
  return {
    id: row.Id,
    title: row.Title,
    description: emptyToNull(row.Description),
    capacity: row.Capacity,
    isActive: row.IsActive,
    isShared: row.IsShared,
    isAuto: row.IsAuto,
    isMultiple: row.IsMultiple,
    locationId: row.LocationId,
    cabinets: [],
    locationNumber: row.LocationNumber,
    locationTitle: row.LocationTitle,
  };
}

function mapCabinetRoomError(err: unknown): CabinetRoomError {
  if (!(err instanceof AxiosError)) {
    return new CabinetRoomError('unknown');
  }
  if (!err.response) {
    return new CabinetRoomError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(CABINET_ROOM_STATUS_TITLE_IS_NOT_VALID)) {
    return new CabinetRoomError('title-invalid');
  }
  if (errorCodes.includes(CABINET_ROOM_STATUS_CABINET_CANNOT_BE_EMPTY)) {
    return new CabinetRoomError('cabinets-empty');
  }
  if (errorCodes.includes(CABINET_ROOM_STATUS_CAPACITY_IS_NOT_VALID)) {
    return new CabinetRoomError('capacity-invalid');
  }
  if (errorCodes.includes(CABINET_ROOM_STATUS_CABINET_NUMBER_IS_NOT_VALID)) {
    return new CabinetRoomError('cabinet-number-invalid');
  }
  if (errorCodes.includes(CABINET_ROOM_STATUS_CABINET_NUMBER_MUST_BE_UNIQUE)) {
    return new CabinetRoomError('cabinet-number-must-be-unique');
  }
  if (errorCodes.includes(CABINET_ROOM_STATUS_CANNOT_ASSIGN_PERSON_TO_AUTO_ROOM)) {
    return new CabinetRoomError('cannot-assign-person-auto-room');
  }
  if (errorCodes.includes(CABINET_ROOM_STATUS_CANNOT_USE_SHARED)) {
    return new CabinetRoomError('cabinet-not-shared');
  }
  if (errorCodes.includes(LOCATION_STATUS_LOCATION_NOT_FOUND)) {
    return new CabinetRoomError('location-not-found');
  }
  if (errorCodes.includes(CABINET_ROOM_STATUS_NOT_FOUND)) {
    return new CabinetRoomError('not-found');
  }
  return new CabinetRoomError('unknown');
}

export async function getCabinetRoomById(id: string): Promise<CabinetRoom | null> {
  const { data } = await httpClient.get<CabinetRoomApiRow | null>(CABINET_ROOM_ENDPOINTS.getById(id));
  return data ? mapCabinetRoomApiRow(data) : null;
}

export async function saveCabinetRoom(payload: CabinetRoomPayload, isEdit: boolean): Promise<void> {
  if (!payload.title.trim() || payload.capacity <= 0 || !payload.locationId) {
    throw new CabinetRoomError('missing-fields');
  }
  if (payload.cabinets.length === 0) {
    throw new CabinetRoomError('cabinets-empty');
  }

  try {
    await httpClient.post(CABINET_ROOM_ENDPOINTS.save(isEdit ? 1 : 0), payload);
  } catch (err) {
    throw mapCabinetRoomError(err);
  }
}

export async function deleteCabinetRoom(id: string): Promise<void> {
  try {
    await httpClient.post(CABINET_ROOM_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapCabinetRoomError(err);
  }
}

/** Cabinet-centric full replacement of the persons assigned to one Cabinet. */
export async function saveCabinetPersons(cabinetId: string, personIds: string[], description: string | null): Promise<void> {
  try {
    await httpClient.post(CABINET_ROOM_ENDPOINTS.saveCabinetPersons, { cabinetId, personIds, description });
  } catch (err) {
    throw mapCabinetRoomError(err);
  }
}
