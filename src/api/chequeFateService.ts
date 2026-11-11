import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { CHEQUE_FATE_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import {
  ChequeFateError,
  type ChequeFateFullInfo,
  type ChequeFateKind,
  type ChequeFateRequestPayload,
  type ChequeFateStatus,
} from '../types/chequeFate';
import type { ChequeDirection } from '../types/cheque';

const FIN_STATUS_CHEQUE_FATE_NOT_FOUND = 37760;
const FIN_STATUS_CHEQUE_FATE_MUST_HAVE_CHEQUES = 37761;
const FIN_STATUS_CHEQUE_FATE_IS_NOT_ALLOWED_FOR_CHEQUE_STATUS = 37762;
const FIN_STATUS_CHEQUE_FATE_KIND_IS_NOT_VALID = 37763;
const FIN_STATUS_CHEQUE_FATE_BANK_ACCOUNT_IS_REQUIRED = 37764;
const FIN_STATUS_CHEQUE_FATE_CLEARED_AMOUNT_IS_NOT_VALID = 37765;
const FIN_STATUS_CHEQUE_FATE_IS_NOT_THE_LATEST_AND_CAN_NOT_BE_CANCELLED = 37766;
const FIN_STATUS_CHEQUE_FATE_CHEQUES_ARE_NOT_VALID = 37767;
const FIN_STATUS_CHEQUE_FATE_REOPENED_DEBT_IS_SETTLED_AND_CAN_NOT_BE_CANCELLED = 37768;
const FIN_STATUS_CHEQUE_HAS_NO_SOURCE_DOCUMENT = 37769;
const FIN_STATUS_CANCEL_REASON_IS_REQUIRED = 37612;

/** GridView row — PascalCase, same convention as every other GridView row. */
export interface ChequeFateGridRow {
  Id: string;
  DocumentNumber: string;
  AccountingEntityTitle: string;
  ChequeDirection: ChequeDirection;
  FateKind: ChequeFateKind;
  DocumentDate: string;
  TotalAmount: number;
  Status: ChequeFateStatus;
}

function mapChequeFateError(err: unknown): ChequeFateError {
  if (!(err instanceof AxiosError)) {
    return new ChequeFateError('unknown');
  }
  if (!err.response) {
    return new ChequeFateError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_CHEQUE_FATE_REOPENED_DEBT_IS_SETTLED_AND_CAN_NOT_BE_CANCELLED)) {
    return new ChequeFateError('reopened-debt-settled');
  }
  if (errorCodes.includes(FIN_STATUS_CHEQUE_FATE_IS_NOT_THE_LATEST_AND_CAN_NOT_BE_CANCELLED)) {
    return new ChequeFateError('not-latest');
  }
  if (errorCodes.includes(FIN_STATUS_CANCEL_REASON_IS_REQUIRED)) {
    return new ChequeFateError('cancel-reason-required');
  }
  if (errorCodes.includes(FIN_STATUS_CHEQUE_HAS_NO_SOURCE_DOCUMENT)) {
    return new ChequeFateError('no-source-document');
  }
  if (errorCodes.includes(FIN_STATUS_CHEQUE_FATE_CHEQUES_ARE_NOT_VALID)) {
    return new ChequeFateError('cheques-invalid');
  }
  if (errorCodes.includes(FIN_STATUS_CHEQUE_FATE_CLEARED_AMOUNT_IS_NOT_VALID)) {
    return new ChequeFateError('cleared-amount-invalid');
  }
  if (errorCodes.includes(FIN_STATUS_CHEQUE_FATE_BANK_ACCOUNT_IS_REQUIRED)) {
    return new ChequeFateError('bank-account-required');
  }
  if (errorCodes.includes(FIN_STATUS_CHEQUE_FATE_IS_NOT_ALLOWED_FOR_CHEQUE_STATUS)) {
    return new ChequeFateError('status-not-allowed');
  }
  if (errorCodes.includes(FIN_STATUS_CHEQUE_FATE_KIND_IS_NOT_VALID)) {
    return new ChequeFateError('fate-kind-invalid');
  }
  if (errorCodes.includes(FIN_STATUS_CHEQUE_FATE_MUST_HAVE_CHEQUES)) {
    return new ChequeFateError('missing-fields');
  }
  if (errorCodes.includes(FIN_STATUS_CHEQUE_FATE_NOT_FOUND)) {
    return new ChequeFateError('not-found');
  }
  return new ChequeFateError('unknown');
}

export async function getChequeFateById(id: string): Promise<ChequeFateFullInfo | null> {
  const { data } = await httpClient.get<ChequeFateFullInfo | null>(CHEQUE_FATE_ENDPOINTS.getById(id));
  return data ?? null;
}

function validatePayload(payload: ChequeFateRequestPayload) {
  if (!payload.accountingEntityId || !payload.documentDate || !payload.fateKind || payload.items.length === 0) {
    throw new ChequeFateError('missing-fields');
  }
}

export async function addChequeFate(payload: ChequeFateRequestPayload): Promise<ChequeFateFullInfo> {
  validatePayload(payload);
  try {
    const { data } = await httpClient.post<ChequeFateFullInfo>(CHEQUE_FATE_ENDPOINTS.add, payload);
    return data;
  } catch (err) {
    throw mapChequeFateError(err);
  }
}

export async function cancelChequeFate(id: string, cancelReason: string, reversalDate: string | null): Promise<void> {
  if (!cancelReason.trim()) {
    throw new ChequeFateError('cancel-reason-required');
  }
  try {
    await httpClient.post(CHEQUE_FATE_ENDPOINTS.cancel, { id, cancelReason, reversalDate });
  } catch (err) {
    throw mapChequeFateError(err);
  }
}
