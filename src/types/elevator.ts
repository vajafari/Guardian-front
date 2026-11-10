export interface ElevatorFloor {
  id: string;
  elevatorId: string;
  title: string;
  actualFloorNumber: number;
  hardwareFloorNumber: number;
}

/** Full-info row (also used by GridView, which fetches this shape). */
export interface ElevatorFloorFullInfo extends ElevatorFloor {
  elevatorTitle: string;
  personCount: number;
}

/** Row shape from GET /api/core/Elevator/GetById/{id} and POST Search. */
export interface Elevator {
  id: string;
  title: string;
  buildingId: string;
  floorCount: number;
  locationId: string;
  validFloors: number[];
  elevatorFloors: ElevatorFloor[];
}

/** GridViewData row, with joined display titles. */
export interface ElevatorFullInfo extends Elevator {
  buildingTitle: string;
  locationNumber: number;
  locationTitle: string;
}

export interface ElevatorFloorPayload {
  id: string;
  title: string;
  actualFloorNumber: number;
  hardwareFloorNumber: number;
}

/** POST /api/core/Elevator/Save/{editMode} body. */
export interface ElevatorPayload {
  id: string;
  title: string;
  buildingId: string;
  floorCount: number;
  /** NOT NULL in the database — always serialize, defaulting to []. */
  validFloors: number[];
  locationId: string;
  elevatorFloors: ElevatorFloorPayload[];
}

export type ElevatorErrorCode =
  | 'missing-fields'
  | 'not-found'
  | 'number-invalid'
  | 'title-invalid'
  | 'floors-invalid'
  | 'floor-title-invalid'
  | 'floor-number-must-be-unique'
  | 'network-error'
  | 'unknown';

export class ElevatorError extends Error {
  code: ElevatorErrorCode;

  constructor(code: ElevatorErrorCode) {
    super(code);
    this.code = code;
    this.name = 'ElevatorError';
  }
}
