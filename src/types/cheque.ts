export type ChequeDirection = 1 | 2; // 1 = Received, 2 = Issued

/** 1 Pending, 2 Deposited (received-only), 3 Cleared, 4 Bounced, 5 Returned, 6 Endorsed (received-only). */
export type ChequeStatus = 1 | 2 | 3 | 4 | 5 | 6;

export interface Cheque {
  id: string;
  accountingEntityId: string;
  chequeDirection: ChequeDirection;
  partyId: string;
  chequeNumber: string;
  sayadId: string | null;
  bankName: string | null;
  cashAccountId: string | null;
  issueDate: string | null;
  dueDate: string;
  amount: number;
  status: ChequeStatus;
  description: string | null;
  depositedCashAccountId: string | null;
  endorsedToPartyId: string | null;
  clearedAmount: number | null;
}

export interface ChequeFullInfo extends Cheque {
  accountingEntityTitle: string;
  partyDisplayName: string;
  cashAccountTitle: string | null;
  isUsedInJournal: boolean;
}

export interface ChequePayload {
  id: string;
  accountingEntityId: string;
  chequeDirection: ChequeDirection;
  partyId: string;
  chequeNumber: string;
  sayadId: string | null;
  bankName: string | null;
  cashAccountId: string | null;
  issueDate: string | null;
  dueDate: string;
  amount: number;
  description: string | null;
}

export type ChequeErrorCode =
  | 'missing-fields'
  | 'sayad-invalid'
  | 'sayad-not-unique'
  | 'party-not-found'
  | 'bank-account-required'
  | 'cannot-change-status'
  | 'locked-fields-in-use'
  | 'in-use'
  | 'not-found'
  | 'network-error'
  | 'unknown';

export class ChequeError extends Error {
  code: ChequeErrorCode;

  constructor(code: ChequeErrorCode) {
    super(code);
    this.code = code;
    this.name = 'ChequeError';
  }
}
