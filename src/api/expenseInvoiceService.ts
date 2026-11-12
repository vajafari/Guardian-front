import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { EXPENSE_INVOICE_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import {
  ExpenseInvoiceError,
  type ExpenseInvoiceFullInfo,
  type ExpenseInvoiceRequestPayload,
  type ExpenseInvoiceStatus,
  type OpenExpenseInvoiceSummary,
} from '../types/expenseInvoice';

const FIN_STATUS_EXPENSE_INVOICE_NOT_FOUND = 37700;
const FIN_STATUS_EXPENSE_INVOICE_MUST_HAVE_ITEMS = 37701;
const FIN_STATUS_EXPENSE_INVOICE_ITEM_IS_NOT_VALID = 37702;
const FIN_STATUS_EXPENSE_INVOICE_PAID_AMOUNT_IS_NOT_VALID = 37703;
const FIN_STATUS_EXPENSE_INVOICE_PAYMENT_CASH_ACCOUNT_IS_REQUIRED = 37704;
const FIN_STATUS_EXPENSE_INVOICE_PARTY_INVOICE_NUMBER_IS_DUPLICATE = 37706;
const FIN_STATUS_EXPENSE_INVOICE_HAS_SETTLEMENTS_AND_CAN_NOT_BE_CANCELLED = 37710;
const FIN_STATUS_DOCUMENT_DATE_IS_NOT_VALID = 37613;
const FIN_STATUS_CANCEL_REASON_IS_REQUIRED = 37612;

/** GridView row — PascalCase, same convention as every other GridView row. */
export interface ExpenseInvoiceGridRow {
  Id: string;
  DocumentNumber: string;
  DocumentDate: string;
  PartyDisplayName: string;
  PartyInvoiceNumber: string;
  TotalAmount: number;
  PaidAmount: number;
  SettledAmount: number;
  OpenAmount: number;
  Status: ExpenseInvoiceStatus;
}

function mapExpenseInvoiceError(err: unknown): ExpenseInvoiceError {
  if (!(err instanceof AxiosError)) {
    return new ExpenseInvoiceError('unknown');
  }
  if (!err.response) {
    return new ExpenseInvoiceError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_EXPENSE_INVOICE_HAS_SETTLEMENTS_AND_CAN_NOT_BE_CANCELLED)) {
    return new ExpenseInvoiceError('has-settlements-can-not-cancel');
  }
  if (errorCodes.includes(FIN_STATUS_CANCEL_REASON_IS_REQUIRED)) {
    return new ExpenseInvoiceError('cancel-reason-required');
  }
  if (errorCodes.includes(FIN_STATUS_EXPENSE_INVOICE_PARTY_INVOICE_NUMBER_IS_DUPLICATE)) {
    return new ExpenseInvoiceError('party-invoice-number-duplicate');
  }
  if (errorCodes.includes(FIN_STATUS_EXPENSE_INVOICE_PAYMENT_CASH_ACCOUNT_IS_REQUIRED)) {
    return new ExpenseInvoiceError('payment-cash-account-required');
  }
  if (errorCodes.includes(FIN_STATUS_EXPENSE_INVOICE_PAID_AMOUNT_IS_NOT_VALID)) {
    return new ExpenseInvoiceError('paid-amount-invalid');
  }
  if (
    errorCodes.includes(FIN_STATUS_EXPENSE_INVOICE_MUST_HAVE_ITEMS) ||
    errorCodes.includes(FIN_STATUS_EXPENSE_INVOICE_ITEM_IS_NOT_VALID) ||
    errorCodes.includes(FIN_STATUS_DOCUMENT_DATE_IS_NOT_VALID)
  ) {
    return new ExpenseInvoiceError('missing-fields');
  }
  if (errorCodes.includes(FIN_STATUS_EXPENSE_INVOICE_NOT_FOUND)) {
    return new ExpenseInvoiceError('not-found');
  }
  return new ExpenseInvoiceError('unknown');
}

export async function getExpenseInvoiceById(id: string): Promise<ExpenseInvoiceFullInfo | null> {
  const { data } = await httpClient.get<ExpenseInvoiceFullInfo | null>(EXPENSE_INVOICE_ENDPOINTS.getById(id));
  return data ?? null;
}

function validatePayload(payload: ExpenseInvoiceRequestPayload) {
  if (!payload.accountingEntityId || !payload.documentDate || !payload.partyId || payload.items.length === 0) {
    throw new ExpenseInvoiceError('missing-fields');
  }
  if (payload.items.some((item) => !item.costCategoryId || !item.fundId || !item.amount)) {
    throw new ExpenseInvoiceError('missing-fields');
  }
  if (payload.paidAmount > 0 && !payload.paymentCashAccountId) {
    throw new ExpenseInvoiceError('payment-cash-account-required');
  }
}

export async function addExpenseInvoice(payload: ExpenseInvoiceRequestPayload): Promise<ExpenseInvoiceFullInfo> {
  validatePayload(payload);
  try {
    const { data } = await httpClient.post<ExpenseInvoiceFullInfo>(EXPENSE_INVOICE_ENDPOINTS.add, {
      ...payload,
      isDraft: false,
      creditUses: [],
    });
    return data;
  } catch (err) {
    throw mapExpenseInvoiceError(err);
  }
}

export async function cancelExpenseInvoice(id: string, cancelReason: string, reversalDate: string | null): Promise<void> {
  if (!cancelReason.trim()) {
    throw new ExpenseInvoiceError('cancel-reason-required');
  }
  try {
    await httpClient.post(EXPENSE_INVOICE_ENDPOINTS.cancel, { id, cancelReason, reversalDate });
  } catch (err) {
    throw mapExpenseInvoiceError(err);
  }
}

/** Open (Posted, OpenAmount>0) invoices for a party — used by PartyPayment's settlement picker. */
export async function searchOpenExpenseInvoicesByParty(accountingEntityId: string, partyId: string): Promise<OpenExpenseInvoiceSummary[]> {
  const { data } = await httpClient.post<Array<{ id: string; documentNumber: string; documentDate: string; openAmount: number }>>(
    EXPENSE_INVOICE_ENDPOINTS.searchFullInfo,
    {
      filter: {
        accountingEntityIds: [accountingEntityId],
        partyIds: [partyId],
        // `OnlyOpen` alone does not filter by Status — pass Statuses explicitly too (same lesson as receivableService.ts).
        statuses: [2],
        onlyOpen: true,
      },
    },
  );
  return data.map((row) => ({ id: row.id, documentNumber: row.documentNumber, documentDate: row.documentDate, openAmount: row.openAmount }));
}
