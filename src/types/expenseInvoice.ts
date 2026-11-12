import type { PaymentSettlementFullInfo } from './paymentSettlement';

/** FinDocumentStatusEnumeration. Every invoice built by this form is posted directly (Status=2). */
export type ExpenseInvoiceStatus = 1 | 2 | 3;

export interface ExpenseInvoiceItemFullInfo {
  id: string;
  description: string | null;
  costCategoryId: string;
  costCategoryTitle: string;
  fundId: string;
  fundTitle: string;
  buildingSpaceId: string | null;
  buildingSpaceTitle: string | null;
  amount: number;
}

/** Row shape from GET /api/fin/ExpenseInvoice/GetById/{id}. */
export interface ExpenseInvoiceFullInfo {
  id: string;
  accountingEntityId: string;
  accountingEntityTitle: string;
  documentNumber: string;
  documentDate: string;
  status: ExpenseInvoiceStatus;
  partyId: string;
  partyDisplayName: string;
  partyInvoiceNumber: string | null;
  buildingId: string | null;
  buildingTitle: string | null;
  totalAmount: number;
  paidAmount: number;
  paymentCashAccountId: string | null;
  paymentCashAccountTitle: string | null;
  description: string | null;
  settledAmount: number;
  openAmount: number;
  hasPendingCheque: boolean;
  cancelReason: string | null;
  itemsFullInfo: ExpenseInvoiceItemFullInfo[];
  settlementsFullInfo: PaymentSettlementFullInfo[];
}

export interface ExpenseInvoiceItemPayload {
  description: string | null;
  costCategoryId: string;
  fundId: string;
  buildingSpaceId: string | null;
  amount: number;
}

export interface ExpenseInvoiceRequestPayload {
  accountingEntityId: string;
  documentDate: string;
  partyId: string;
  partyInvoiceNumber: string | null;
  buildingId: string | null;
  paidAmount: number;
  paymentCashAccountId: string | null;
  description: string | null;
  items: ExpenseInvoiceItemPayload[];
}

/** Open invoice summary for the PartyPayment settlement picker. */
export interface OpenExpenseInvoiceSummary {
  id: string;
  documentNumber: string;
  documentDate: string;
  openAmount: number;
}

export type ExpenseInvoiceErrorCode =
  | 'missing-fields'
  | 'paid-amount-invalid'
  | 'payment-cash-account-required'
  | 'party-invoice-number-duplicate'
  | 'has-settlements-can-not-cancel'
  | 'cancel-reason-required'
  | 'not-found'
  | 'network-error'
  | 'unknown';

export class ExpenseInvoiceError extends Error {
  code: ExpenseInvoiceErrorCode;

  constructor(code: ExpenseInvoiceErrorCode) {
    super(code);
    this.code = code;
    this.name = 'ExpenseInvoiceError';
  }
}
