/** BuildingDepositMovementKindEnumeration. 1 Received, 2 Returned, 3 Forfeited, 4 Settled. */
export type BuildingDepositMovementKind = 1 | 2 | 3 | 4;

/** FinDocumentStatusEnumeration. Every movement created by this form is posted directly (Status=2). */
export type BuildingDepositMovementStatus = 1 | 2 | 3;

export interface BuildingDepositMovementFullInfo {
  id: string;
  documentNumber: string;
  documentDate: string;
  movementKind: BuildingDepositMovementKind;
  amount: number;
  cashAccountId: string | null;
  cashAccountTitle: string | null;
  fundId: string | null;
  description: string | null;
  status: BuildingDepositMovementStatus;
  cancelReason: string | null;
}

export interface BuildingDepositMovementSettlementPayload {
  receivableId: string;
  amount: number;
}

export interface BuildingDepositMovementRequestPayload {
  buildingDepositId: string;
  documentDate: string;
  movementKind: BuildingDepositMovementKind;
  amount: number;
  cashAccountId: string | null;
  fundId: string | null;
  description: string | null;
  settlements: BuildingDepositMovementSettlementPayload[];
}

export type BuildingDepositMovementErrorCode =
  | 'missing-fields'
  | 'not-found'
  | 'can-not-cancel'
  | 'cancel-reason-required'
  | 'network-error'
  | 'unknown';

export class BuildingDepositMovementError extends Error {
  code: BuildingDepositMovementErrorCode;

  constructor(code: BuildingDepositMovementErrorCode) {
    super(code);
    this.code = code;
    this.name = 'BuildingDepositMovementError';
  }
}
