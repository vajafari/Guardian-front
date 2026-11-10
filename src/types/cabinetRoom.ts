export interface Cabinet {
  id: string;
  cabinetRoomId: string;
  cabinetNumber: number;
  description: string | null;
  /** Derived client-side from the nested CabinetPersons returned by GetById. */
  personIds: string[];
}

/** Row shape from GET /api/core/CabinetRoom/GetById/{id}. */
export interface CabinetRoom {
  id: string;
  title: string;
  description: string | null;
  capacity: number;
  isActive: boolean;
  isShared: boolean;
  isAuto: boolean;
  isMultiple: boolean;
  locationId: string;
  cabinets: Cabinet[];
}

/** GridViewData row, with joined display titles. */
export interface CabinetRoomFullInfo extends CabinetRoom {
  locationNumber: number;
  locationTitle: string;
}

export interface CabinetPayload {
  id: string;
  cabinetNumber: number;
  description: string | null;
}

/** POST /api/core/CabinetRoom/Save/{editMode} body. */
export interface CabinetRoomPayload {
  id: string;
  title: string;
  description: string | null;
  capacity: number;
  isActive: boolean;
  isShared: boolean;
  isAuto: boolean;
  isMultiple: boolean;
  locationId: string;
  cabinets: CabinetPayload[];
}

export type CabinetRoomErrorCode =
  | 'missing-fields'
  | 'title-invalid'
  | 'cabinets-empty'
  | 'capacity-invalid'
  | 'cabinet-number-invalid'
  | 'cabinet-number-must-be-unique'
  | 'cannot-assign-person-auto-room'
  | 'cabinet-not-shared'
  | 'location-not-found'
  | 'not-found'
  | 'network-error'
  | 'unknown';

export class CabinetRoomError extends Error {
  code: CabinetRoomErrorCode;

  constructor(code: CabinetRoomErrorCode) {
    super(code);
    this.code = code;
    this.name = 'CabinetRoomError';
  }
}
