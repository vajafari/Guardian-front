import type { Building } from './building';
import type { BuildingUnit } from './buildingUnit';
import type { BuildingParkingSpot } from './buildingParkingSpot';
import type { BuildingStorageRoom } from './buildingStorageRoom';

/** Nested inside GET /api/core/Building/GetById/{id}'s floorsFullInfo. */
export interface BuildingFloor {
  id: string;
  buildingId: string;
  title: string;
  floorActualNumber: number;
  floorHardwareNumber: number;
}

/** GET /api/core/Building/GetById/{id} response. */
export interface BuildingFullInfo extends Building {
  floorsFullInfo: BuildingFloor[];
}

/** GET /api/core/BuildingFloor/GetById/{id} response. */
export interface BuildingFloorFullInfo extends BuildingFloor {
  buildingNumber: number;
  buildingTitle: string;
  unitsFullInfo: BuildingUnit[];
  parkingSpotsFullInfo: BuildingParkingSpot[];
  storageRoomsFullInfo: BuildingStorageRoom[];
}

/** POST /api/core/BuildingFloor/Add and /Update body. */
export interface BuildingFloorPayload {
  id: string;
  buildingId: string;
  title: string;
  floorActualNumber: number;
  floorHardwareNumber: number;
}

export type BuildingFloorErrorCode = 'missing-fields' | 'network-error' | 'unknown';

export class BuildingFloorError extends Error {
  code: BuildingFloorErrorCode;

  constructor(code: BuildingFloorErrorCode) {
    super(code);
    this.code = code;
    this.name = 'BuildingFloorError';
  }
}
