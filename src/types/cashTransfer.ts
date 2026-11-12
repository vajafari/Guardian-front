/** FinDocumentStatusEnumeration. Every transfer created by this form is posted directly (Status=2). */
export type CashTransferStatus = 1 | 2 | 3;

/** Row shape from GET /api/fin/CashTransfer/GetById/{id}. */
export interface CashTransferFullInfo {
  id: string;
  accountingEntityId: string;
  accountingEntityTitle: string;
  documentNumber: string;
  documentDate: string;
  status: CashTransferStatus;
  sourceCashAccountId: string;
  sourceCashAccountTitle: string;
  destinationCashAccountId: string;
  destinationCashAccountTitle: string;
  amount: number;
  description: string | null;
  cancelReason: string | null;
}

export interface CashTransferRequestPayload {
  accountingEntityId: string;
  documentDate: string;
  sourceCashAccountId: string;
  destinationCashAccountId: string;
  amount: number;
  description: string | null;
}

export type CashTransferErrorCode =
  | 'missing-fields'
  | 'not-found'
  | 'cancel-reason-required'
  | 'network-error'
  | 'unknown';

export class CashTransferError extends Error {
  code: CashTransferErrorCode;

  constructor(code: CashTransferErrorCode) {
    super(code);
    this.code = code;
    this.name = 'CashTransferError';
  }
}
