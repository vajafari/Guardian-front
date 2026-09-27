import type { Building } from './building';

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
