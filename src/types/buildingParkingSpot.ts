/** Nested inside GET /api/core/BuildingFloor/GetById/{id}'s parkingSpotsFullInfo. */
export interface BuildingParkingSpot {
  id: string;
  title: string;
  parkingSpotNumber: string;
  buildingUnitId: string | null;
  buildingFloorId: string;
}

/** POST /api/core/BuildingParkingSpot/Add and /Update body. */
export interface BuildingParkingSpotPayload {
  id: string;
  title: string;
  parkingSpotNumber: string;
  buildingUnitId: string | null;
  buildingFloorId: string;
}

export type BuildingParkingSpotErrorCode = 'missing-fields' | 'network-error' | 'unknown';

export class BuildingParkingSpotError extends Error {
  code: BuildingParkingSpotErrorCode;

  constructor(code: BuildingParkingSpotErrorCode) {
    super(code);
    this.code = code;
    this.name = 'BuildingParkingSpotError';
  }
}
