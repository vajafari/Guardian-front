/** FinDocumentStatusEnumeration. */
export type PartyPaymentStatus = 1 | 2 | 3;

/** PartyPaymentMethodEnumeration. 1 = CashAccount, 2 = IssuedCheque, 3 = EndorsedCheque. */
export type PartyPaymentMethod = 1 | 2 | 3;

export interface PartyPaymentChequeFullInfo {
  id: string;
  chequeNumber: string;
  chequeDueDate: string;
  chequeAmount: number;
  chequeStatus: number;
  chequeDirection: number;
}

/** Row shape from GET /api/fin/PartyPayment/GetById/{id}. */
export interface PartyPaymentFullInfo {
  id: string;
  accountingEntityId: string;
  accountingEntityTitle: string;
  documentNumber: string;
  documentDate: string;
  status: PartyPaymentStatus;
  partyId: string;
  partyDisplayName: string;
  settledAccountTitle: string;
  paymentMethod: PartyPaymentMethod;
  cashAccountId: string | null;
  cashAccountTitle: string | null;
  amount: number;
  description: string | null;
  settledAmount: number;
  bouncedAmount: number;
  unsettledAmount: number;
  cancelReason: string | null;
  chequesFullInfo: PartyPaymentChequeFullInfo[];
}

export interface PartyPaymentIssuedChequePayload {
  chequeNumber: string;
  sayadId: string | null;
  bankName: string | null;
  cashAccountId: string;
  issueDate: string | null;
  dueDate: string;
  amount: number;
  description: string | null;
}

export interface PartyPaymentRequestPayload {
  accountingEntityId: string;
  documentDate: string;
  partyId: string;
  settledAccountId: string;
  paymentMethod: PartyPaymentMethod;
  cashAccountId: string | null;
  amount: number;
  description: string | null;
  issuedCheques: PartyPaymentIssuedChequePayload[];
  endorsedChequeIds: string[];
}

export type PartyPaymentErrorCode =
  | 'missing-fields'
  | 'settled-account-invalid'
  | 'endorsed-cheque-invalid'
  | 'sayad-not-unique'
  | 'cancel-reason-required'
  | 'moved-cheques-can-not-cancel'
  | 'credit-in-use'
  | 'not-found'
  | 'network-error'
  | 'unknown';

export class PartyPaymentError extends Error {
  code: PartyPaymentErrorCode;

  constructor(code: PartyPaymentErrorCode) {
    super(code);
    this.code = code;
    this.name = 'PartyPaymentError';
  }
}
