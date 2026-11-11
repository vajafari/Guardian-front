/** FinDocumentStatusEnumeration. */
export type LateFeeRunStatus = 1 | 2 | 3;

export interface LateFeeRunFeeFullInfo {
  id: string;
  partyDisplayName: string;
  buildingUnitTitle: string | null;
  buildingSpaceTitle: string | null;
  buildingTitle: string;
  amount: number;
  dueDate: string;
  feeFromDate: string | null;
  feeToDate: string | null;
  title: string;
  settledAmount: number;
  openAmount: number;
}

/** Row shape from GET /api/fin/LateFeeRun/GetById/{id}. */
export interface LateFeeRunFullInfo {
  id: string;
  accountingEntityId: string;
  accountingEntityTitle: string;
  fiscalYearId: string;
  documentNumber: string;
  documentDate: string;
  status: LateFeeRunStatus;
  feeCount: number;
  totalAmount: number;
  description: string | null;
  cancelReason: string | null;
  feesFullInfo: LateFeeRunFeeFullInfo[];
}

export interface LateFeeRunRequestPayload {
  accountingEntityId: string;
  documentDate: string;
  description: string | null;
}

/** POST /api/fin/LateFeeRun/Preview response, flattened — the raw DtoReceivable[] has no joined titles, so only a count+total summary is kept. */
export interface LateFeeRunPreview {
  feeCount: number;
  feeTotal: number;
}

export type LateFeeRunErrorCode =
  | 'missing-fields'
  | 'accounting-entity-not-found'
  | 'charge-plan-not-found'
  | 'late-fee-off'
  | 'nothing-to-calculate'
  | 'cancel-reason-required'
  | 'not-latest-run'
  | 'already-settled'
  | 'not-found'
  | 'network-error'
  | 'unknown';

export class LateFeeRunError extends Error {
  code: LateFeeRunErrorCode;

  constructor(code: LateFeeRunErrorCode) {
    super(code);
    this.code = code;
    this.name = 'LateFeeRunError';
  }
}
