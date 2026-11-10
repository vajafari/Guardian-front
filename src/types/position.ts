export interface Position {
  id: string;
  positionNumber: number;
  title: string;
}

/** POST /api/core/Position/Add or /Update body. */
export interface PositionPayload {
  id: string;
  positionNumber: number;
  title: string;
}

export type PositionErrorCode =
  | 'missing-fields'
  | 'number-invalid'
  | 'title-invalid'
  | 'number-already-exists'
  | 'not-found'
  | 'network-error'
  | 'unknown';

export class PositionError extends Error {
  code: PositionErrorCode;

  constructor(code: PositionErrorCode) {
    super(code);
    this.code = code;
    this.name = 'PositionError';
  }
}
