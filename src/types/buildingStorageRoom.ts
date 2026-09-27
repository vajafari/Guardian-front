/** Nested inside GET /api/core/BuildingFloor/GetById/{id}'s storageRoomsFullInfo. */
export interface BuildingStorageRoom {
  id: string;
  title: string;
  storageRoomNumber: string;
  buildingUnitId: string | null;
  buildingFloorId: string;
}

/** POST /api/core/BuildingStorageRoom/Add and /Update body. */
export interface BuildingStorageRoomPayload {
  id: string;
  title: string;
  storageRoomNumber: string;
  buildingUnitId: string | null;
  buildingFloorId: string;
}

export type BuildingStorageRoomErrorCode = 'missing-fields' | 'network-error' | 'unknown';

export class BuildingStorageRoomError extends Error {
  code: BuildingStorageRoomErrorCode;

  constructor(code: BuildingStorageRoomErrorCode) {
    super(code);
    this.code = code;
    this.name = 'BuildingStorageRoomError';
  }
}
