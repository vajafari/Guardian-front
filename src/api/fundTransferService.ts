import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { FUND_TRANSFER_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { FundTransferError, type FundTransferFullInfo, type FundTransferRequestPayload, type FundTransferStatus } from '../types/fundTransfer';

const FIN_STATUS_FUND_TRANSFER_NOT_FOUND = 37750;
const FIN_STATUS_FUND_TRANSFER_IS_NOT_VALID = 37751;
const FIN_STATUS_ACCOUNTING_ENTITY_NOT_FOUND = 37001;
const FIN_STATUS_DOCUMENT_DATE_IS_NOT_VALID = 37613;
const FIN_STATUS_CANCEL_REASON_IS_REQUIRED = 37612;

/** GridView row — PascalCase, same convention as every other GridView row. */
export interface FundTransferGridRow {
  Id: string;
  DocumentNumber: string;
  DocumentDate: string;
  SourceFundTitle: string;
  TargetFundTitle: string;
  Amount: number;
  Status: FundTransferStatus;
}

function mapFundTransferError(err: unknown): FundTransferError {
  if (!(err instanceof AxiosError)) {
    return new FundTransferError('unknown');
  }
  if (!err.response) {
    return new FundTransferError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_CANCEL_REASON_IS_REQUIRED)) {
    return new FundTransferError('cancel-reason-required');
  }
  if (
    errorCodes.includes(FIN_STATUS_FUND_TRANSFER_IS_NOT_VALID) ||
    errorCodes.includes(FIN_STATUS_ACCOUNTING_ENTITY_NOT_FOUND) ||
    errorCodes.includes(FIN_STATUS_DOCUMENT_DATE_IS_NOT_VALID)
  ) {
    return new FundTransferError('missing-fields');
  }
  if (errorCodes.includes(FIN_STATUS_FUND_TRANSFER_NOT_FOUND)) {
    return new FundTransferError('not-found');
  }
  return new FundTransferError('unknown');
}

export async function getFundTransferById(id: string): Promise<FundTransferFullInfo | null> {
  const { data } = await httpClient.get<FundTransferFullInfo | null>(FUND_TRANSFER_ENDPOINTS.getById(id));
  return data ?? null;
}

function validatePayload(payload: FundTransferRequestPayload) {
  if (!payload.accountingEntityId || !payload.documentDate || !payload.sourceFundId || !payload.targetFundId || !payload.amount) {
    throw new FundTransferError('missing-fields');
  }
  if (payload.sourceFundId === payload.targetFundId) {
    throw new FundTransferError('missing-fields');
  }
  if (!payload.description.trim()) {
    throw new FundTransferError('missing-fields');
  }
}

export async function addFundTransfer(payload: FundTransferRequestPayload): Promise<FundTransferFullInfo> {
  validatePayload(payload);
  try {
    const { data } = await httpClient.post<FundTransferFullInfo>(FUND_TRANSFER_ENDPOINTS.add, payload);
    return data;
  } catch (err) {
    throw mapFundTransferError(err);
  }
}

export async function cancelFundTransfer(id: string, cancelReason: string, reversalDate: string | null): Promise<void> {
  if (!cancelReason.trim()) {
    throw new FundTransferError('cancel-reason-required');
  }
  try {
    await httpClient.post(FUND_TRANSFER_ENDPOINTS.cancel, { id, cancelReason, reversalDate });
  } catch (err) {
    throw mapFundTransferError(err);
  }
}
