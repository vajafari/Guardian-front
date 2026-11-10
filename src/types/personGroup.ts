export interface PersonGroupPersonFullInfo {
  id: string;
  personGroupId: string;
  personId: string;
  personNumberOnDevice: string;
  firstName: string | null;
  lastName: string | null;
  nationalId: string | null;
}

/** Row shape from GridViewData. */
export interface PersonGroup {
  id: string;
  title: string;
  description: string | null;
}

export interface PersonGroupFullInfo extends PersonGroup {
  personCount: number;
}

/** GET /api/core/PersonGroup/GetById/{personGroupId} response (always includes the full person list). */
export interface PersonGroupDetail extends PersonGroup {
  personGroupPersonsFullInfo: PersonGroupPersonFullInfo[];
}

/** POST /api/core/PersonGroup/Add and /Save body. */
export interface PersonGroupPayload {
  id: string;
  title: string;
  description: string | null;
  personIds: string[];
}

export type PersonGroupErrorCode =
  | 'missing-fields'
  | 'title-already-exists'
  | 'title-invalid'
  | 'not-found'
  | 'network-error'
  | 'unknown';

export class PersonGroupError extends Error {
  code: PersonGroupErrorCode;

  constructor(code: PersonGroupErrorCode) {
    super(code);
    this.code = code;
    this.name = 'PersonGroupError';
  }
}
