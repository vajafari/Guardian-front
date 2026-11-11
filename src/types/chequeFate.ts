import type { ChequeDirection, ChequeStatus } from './cheque';

export type ChequeFateKind = 1 | 2 | 3 | 4; // 1 Deposited, 2 Cleared, 3 Bounced, 4 Returned

/** FinDocumentStatusEnumeration. */
export type ChequeFateStatus = 1 | 2 | 3;

export interface ChequeFateItemFullInfo {
  id: string;
  chequeId: string;
  chequeNumber: string;
  chequeAmount: number;
  chequeDueDate: string;
  chequePartyId: string;
  cashAccountId: string | null;
  clearedAmount: number | null;
  previousStatus: ChequeStatus;
}

/** Row shape from GET /api/fin/ChequeFate/GetById/{id}. */
export interface ChequeFateFullInfo {
  id: string;
  accountingEntityId: string;
  accountingEntityTitle: string;
  documentNumber: string;
  documentDate: string;
  status: ChequeFateStatus;
  chequeDirection: ChequeDirection;
  fateKind: ChequeFateKind;
  description: string | null;
  totalAmount: number;
  cancelReason: string | null;
  itemsFullInfo: ChequeFateItemFullInfo[];
}

export interface ChequeFateItemPayload {
  chequeId: string;
  cashAccountId: string | null;
  clearedAmount: number | null;
}

export interface ChequeFateRequestPayload {
  accountingEntityId: string;
  documentDate: string;
  chequeDirection: ChequeDirection;
  fateKind: ChequeFateKind;
  description: string | null;
  items: ChequeFateItemPayload[];
}

export type ChequeFateErrorCode =
  | 'missing-fields'
  | 'fate-kind-invalid'
  | 'cheques-invalid'
  | 'bank-account-required'
  | 'cleared-amount-invalid'
  | 'status-not-allowed'
  | 'no-source-document'
  | 'cancel-reason-required'
  | 'not-latest'
  | 'reopened-debt-settled'
  | 'not-found'
  | 'network-error'
  | 'unknown';

export class ChequeFateError extends Error {
  code: ChequeFateErrorCode;

  constructor(code: ChequeFateErrorCode) {
    super(code);
    this.code = code;
    this.name = 'ChequeFateError';
  }
}
