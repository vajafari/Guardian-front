/** Row shape from POST /api/core/Building/Search. */
export interface Building {
  id: string;
  buildingNumber: number;
  title: string;
}

/** POST /api/core/Building/Add and /Update body. */
export interface BuildingPayload {
  id: string;
  buildingNumber: number;
  title: string;
}

export type BuildingErrorCode = 'missing-fields' | 'network-error' | 'unknown';

export class BuildingError extends Error {
  code: BuildingErrorCode;

  constructor(code: BuildingErrorCode) {
    super(code);
    this.code = code;
    this.name = 'BuildingError';
  }
}
