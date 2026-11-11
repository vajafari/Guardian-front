import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { RECEIPT_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { ReceiptError, type ReceiptFullInfo, type ReceiptRequestPayload, type ReceiptStatus } from '../types/receipt';

const FIN_STATUS_RECEIPT_NOT_FOUND = 37900;
const FIN_STATUS_RECEIPT_IS_NOT_VALID = 37901;
const FIN_STATUS_RECEIPT_CHEQUES_ARE_NOT_VALID = 37902;
const FIN_STATUS_RECEIPT_ALLOCATION_IS_NOT_VALID = 37903;
const FIN_STATUS_RECEIPT_OVERPAYMENT_ITEM_IS_REQUIRED = 37904;
const FIN_STATUS_RECEIPT_CREDIT_IS_USED_AND_CAN_NOT_BE_CANCELLED = 37908;
const FIN_STATUS_CHEQUE_SAYAD_ID_MUST_BE_UNIQUE = 37313;
const FIN_STATUS_DOCUMENT_DATE_IS_NOT_VALID = 37613;
const FIN_STATUS_CANCEL_REASON_IS_REQUIRED = 37612;

/** GridView row — PascalCase, same convention as every other GridView row. */
export interface ReceiptGridRow {
  Id: string;
  DocumentNumber: string;
  DocumentDate: string;
  PartyDisplayName: string;
  CashAccountTitle: string;
  Amount: number;
  AllocatedAmount: number;
  OverpaymentAmount: number;
  Status: ReceiptStatus;
}

function mapReceiptError(err: unknown): ReceiptError {
  if (!(err instanceof AxiosError)) {
    return new ReceiptError('unknown');
  }
  if (!err.response) {
    return new ReceiptError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_RECEIPT_CREDIT_IS_USED_AND_CAN_NOT_BE_CANCELLED)) {
    return new ReceiptError('credit-in-use');
  }
  if (errorCodes.includes(FIN_STATUS_CANCEL_REASON_IS_REQUIRED)) {
    return new ReceiptError('cancel-reason-required');
  }
  if (errorCodes.includes(FIN_STATUS_RECEIPT_OVERPAYMENT_ITEM_IS_REQUIRED)) {
    return new ReceiptError('overpayment-target-required');
  }
  if (errorCodes.includes(FIN_STATUS_CHEQUE_SAYAD_ID_MUST_BE_UNIQUE)) {
    return new ReceiptError('sayad-not-unique');
  }
  if (errorCodes.includes(FIN_STATUS_RECEIPT_CHEQUES_ARE_NOT_VALID)) {
    return new ReceiptError('cheques-invalid');
  }
  if (errorCodes.includes(FIN_STATUS_RECEIPT_ALLOCATION_IS_NOT_VALID)) {
    return new ReceiptError('allocation-invalid');
  }
  if (errorCodes.includes(FIN_STATUS_DOCUMENT_DATE_IS_NOT_VALID) || errorCodes.includes(FIN_STATUS_RECEIPT_IS_NOT_VALID)) {
    return new ReceiptError('missing-fields');
  }
  if (errorCodes.includes(FIN_STATUS_RECEIPT_NOT_FOUND)) {
    return new ReceiptError('not-found');
  }
  return new ReceiptError('unknown');
}

export async function getReceiptById(id: string): Promise<ReceiptFullInfo | null> {
  const { data } = await httpClient.get<ReceiptFullInfo | null>(RECEIPT_ENDPOINTS.getById(id));
  return data ?? null;
}

function validatePayload(payload: ReceiptRequestPayload) {
  if (!payload.accountingEntityId || !payload.documentDate || !payload.partyId || !payload.amount) {
    throw new ReceiptError('missing-fields');
  }
  if (payload.paymentMethod === 4) {
    if (payload.cheques.length === 0) {
      throw new ReceiptError('cheques-invalid');
    }
  } else if (!payload.cashAccountId) {
    throw new ReceiptError('missing-fields');
  }
}

export async function addReceipt(payload: ReceiptRequestPayload): Promise<ReceiptFullInfo> {
  validatePayload(payload);
  try {
    const { data } = await httpClient.post<ReceiptFullInfo>(RECEIPT_ENDPOINTS.add, {
      ...payload,
      receiptKind: 1,
    });
    return data;
  } catch (err) {
    throw mapReceiptError(err);
  }
}

export async function cancelReceipt(id: string, cancelReason: string, reversalDate: string | null): Promise<void> {
  if (!cancelReason.trim()) {
    throw new ReceiptError('cancel-reason-required');
  }
  try {
    await httpClient.post(RECEIPT_ENDPOINTS.cancel, { id, cancelReason, reversalDate });
  } catch (err) {
    throw mapReceiptError(err);
  }
}
