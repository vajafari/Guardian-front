export type CashAccountType = 1 | 2 | 3; // 1 = Bank, 2 = CashBox, 3 = PettyCash

export interface CashAccount {
  id: string;
  accountingEntityId: string;
  cashAccountType: CashAccountType;
  title: string;
  bankName: string | null;
  branchName: string | null;
  accountNumber: string | null;
  sheba: string | null;
  cardNumber: string | null;
  custodianPartyId: string | null;
  isActive: boolean;
  description: string | null;
}

export interface CashAccountPayload {
  id: string;
  accountingEntityId: string;
  cashAccountType: CashAccountType;
  title: string;
  bankName: string | null;
  branchName: string | null;
  accountNumber: string | null;
  sheba: string | null;
  cardNumber: string | null;
  custodianPartyId: string | null;
  isActive: boolean;
  description: string | null;
}

export type CashAccountErrorCode =
  | 'missing-fields'
  | 'sheba-invalid'
  | 'card-number-invalid'
  | 'custodian-not-found'
  | 'bank-fields-not-allowed'
  | 'type-can-not-be-changed'
  | 'in-use'
  | 'not-found'
  | 'network-error'
  | 'unknown';

export class CashAccountError extends Error {
  code: CashAccountErrorCode;

  constructor(code: CashAccountErrorCode) {
    super(code);
    this.code = code;
    this.name = 'CashAccountError';
  }
}
