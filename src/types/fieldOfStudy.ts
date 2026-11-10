export interface FieldOfStudy {
  id: string;
  title: string;
}

/** POST /api/core/FieldOfStudy/Add or /Update body. */
export interface FieldOfStudyPayload {
  id: string;
  title: string;
}

export type FieldOfStudyErrorCode = 'missing-fields' | 'title-invalid' | 'not-found' | 'network-error' | 'unknown';

export class FieldOfStudyError extends Error {
  code: FieldOfStudyErrorCode;

  constructor(code: FieldOfStudyErrorCode) {
    super(code);
    this.code = code;
    this.name = 'FieldOfStudyError';
  }
}
