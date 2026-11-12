import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { CASH_TRANSFER_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { CashTransferError, type CashTransferFullInfo, type CashTransferRequestPayload, type CashTransferStatus } from '../types/cashTransfer';

const FIN_STATUS_CASH_TRANSFER_NOT_FOUND = 37740;
const FIN_STATUS_CASH_TRANSFER_IS_NOT_VALID = 37741;
const FIN_STATUS_ACCOUNTING_ENTITY_NOT_FOUND = 37001;
const FIN_STATUS_DOCUMENT_DATE_IS_NOT_VALID = 37613;
const FIN_STATUS_CANCEL_REASON_IS_REQUIRED = 37612;

/** GridView row — PascalCase, same convention as every other GridView row. */
export interface CashTransferGridRow {
  Id: string;
  DocumentNumber: string;
  DocumentDate: string;
  SourceCashAccountTitle: string;
  DestinationCashAccountTitle: string;
  Amount: number;
  Status: CashTransferStatus;
}

function mapCashTransferError(err: unknown): CashTransferError {
  if (!(err instanceof AxiosError)) {
    return new CashTransferError('unknown');
  }
  if (!err.response) {
    return new CashTransferError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_CANCEL_REASON_IS_REQUIRED)) {
    return new CashTransferError('cancel-reason-required');
  }
  if (
    errorCodes.includes(FIN_STATUS_CASH_TRANSFER_IS_NOT_VALID) ||
    errorCodes.includes(FIN_STATUS_ACCOUNTING_ENTITY_NOT_FOUND) ||
    errorCodes.includes(FIN_STATUS_DOCUMENT_DATE_IS_NOT_VALID)
  ) {
    return new CashTransferError('missing-fields');
  }
  if (errorCodes.includes(FIN_STATUS_CASH_TRANSFER_NOT_FOUND)) {
    return new CashTransferError('not-found');
  }
  return new CashTransferError('unknown');
}

export async function getCashTransferById(id: string): Promise<CashTransferFullInfo | null> {
  const { data } = await httpClient.get<CashTransferFullInfo | null>(CASH_TRANSFER_ENDPOINTS.getById(id));
  return data ?? null;
}

function validatePayload(payload: CashTransferRequestPayload) {
  if (!payload.accountingEntityId || !payload.documentDate || !payload.sourceCashAccountId || !payload.destinationCashAccountId || !payload.amount) {
    throw new CashTransferError('missing-fields');
  }
  if (payload.sourceCashAccountId === payload.destinationCashAccountId) {
    throw new CashTransferError('missing-fields');
  }
}

export async function addCashTransfer(payload: CashTransferRequestPayload): Promise<CashTransferFullInfo> {
  validatePayload(payload);
  try {
    const { data } = await httpClient.post<CashTransferFullInfo>(CASH_TRANSFER_ENDPOINTS.add, payload);
    return data;
  } catch (err) {
    throw mapCashTransferError(err);
  }
}

export async function cancelCashTransfer(id: string, cancelReason: string, reversalDate: string | null): Promise<void> {
  if (!cancelReason.trim()) {
    throw new CashTransferError('cancel-reason-required');
  }
  try {
    await httpClient.post(CASH_TRANSFER_ENDPOINTS.cancel, { id, cancelReason, reversalDate });
  } catch (err) {
    throw mapCashTransferError(err);
  }
}
