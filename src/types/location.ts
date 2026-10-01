/** Row shape from GET /api/core/Location/GetAll. */
export interface Location {
  id: string;
  locationNumber: number;
  title: string;
  description: string | null;
  parentLocationId: string | null;
  isAutoSyncDisabled: boolean;
}

/** POST /api/core/Location/Add and /Update body. */
export interface LocationPayload {
  id: string;
  locationNumber: number;
  title: string;
  description: string | null;
  parentLocationId: string | null;
  isAutoSyncDisabled: boolean;
  personLocations: [];
  personGroupLocations: [];
}

export type LocationErrorCode =
  | 'missing-fields'
  | 'number-already-exists'
  | 'parent-cycle'
  | 'network-error'
  | 'unknown';

export class LocationError extends Error {
  code: LocationErrorCode;

  constructor(code: LocationErrorCode) {
    super(code);
    this.code = code;
    this.name = 'LocationError';
  }
}
