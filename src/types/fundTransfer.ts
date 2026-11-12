/** FinDocumentStatusEnumeration. Every transfer created by this form is posted directly (Status=2). */
export type FundTransferStatus = 1 | 2 | 3;

/** Row shape from GET /api/fin/FundTransfer/GetById/{id}. */
export interface FundTransferFullInfo {
  id: string;
  accountingEntityId: string;
  accountingEntityTitle: string;
  documentNumber: string;
  documentDate: string;
  status: FundTransferStatus;
  sourceFundId: string;
  sourceFundTitle: string;
  targetFundId: string;
  targetFundTitle: string;
  amount: number;
  description: string;
  cancelReason: string | null;
}

export interface FundTransferRequestPayload {
  accountingEntityId: string;
  documentDate: string;
  sourceFundId: string;
  targetFundId: string;
  amount: number;
  description: string;
}

export type FundTransferErrorCode =
  | 'missing-fields'
  | 'not-found'
  | 'cancel-reason-required'
  | 'network-error'
  | 'unknown';

export class FundTransferError extends Error {
  code: FundTransferErrorCode;

  constructor(code: FundTransferErrorCode) {
    super(code);
    this.code = code;
    this.name = 'FundTransferError';
  }
}
