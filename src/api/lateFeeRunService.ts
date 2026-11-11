import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { LATE_FEE_RUN_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import {
  LateFeeRunError,
  type LateFeeRunFullInfo,
  type LateFeeRunPreview,
  type LateFeeRunRequestPayload,
  type LateFeeRunStatus,
} from '../types/lateFeeRun';

const FIN_STATUS_ACCOUNTING_ENTITY_NOT_FOUND = 37001;
const FIN_STATUS_CANCEL_REASON_IS_REQUIRED = 37612;
const FIN_STATUS_DOCUMENT_DATE_IS_NOT_VALID = 37613;
const FIN_STATUS_CHARGE_PLAN_NOT_FOUND = 37800;
const FIN_STATUS_LATE_FEE_RUN_NOT_FOUND = 37840;
const FIN_STATUS_LATE_FEE_IS_OFF = 37841;
const FIN_STATUS_LATE_FEE_RUN_NOTHING_TO_CALCULATE = 37842;
const FIN_STATUS_LATE_FEE_IS_SETTLED_AND_CAN_NOT_BE_CANCELLED = 37843;
const FIN_STATUS_LATE_FEE_RUN_IS_NOT_THE_LATEST_AND_CAN_NOT_BE_CANCELLED = 37844;

/** GridView row — PascalCase, same convention as every other GridView row. */
export interface LateFeeRunGridRow {
  Id: string;
  DocumentNumber: string;
  AccountingEntityTitle: string;
  DocumentDate: string;
  FeeCount: number;
  TotalAmount: number;
  Status: LateFeeRunStatus;
}

interface DtoReceivable {
  amount: number;
}

function mapLateFeeRunPreview(data: DtoReceivable[]): LateFeeRunPreview {
  return {
    feeCount: data.length,
    feeTotal: data.reduce((sum, fee) => sum + fee.amount, 0),
  };
}

function mapLateFeeRunError(err: unknown): LateFeeRunError {
  if (!(err instanceof AxiosError)) {
    return new LateFeeRunError('unknown');
  }
  if (!err.response) {
    return new LateFeeRunError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_LATE_FEE_IS_SETTLED_AND_CAN_NOT_BE_CANCELLED)) {
    return new LateFeeRunError('already-settled');
  }
  if (errorCodes.includes(FIN_STATUS_LATE_FEE_RUN_IS_NOT_THE_LATEST_AND_CAN_NOT_BE_CANCELLED)) {
    return new LateFeeRunError('not-latest-run');
  }
  if (errorCodes.includes(FIN_STATUS_CANCEL_REASON_IS_REQUIRED)) {
    return new LateFeeRunError('cancel-reason-required');
  }
  if (errorCodes.includes(FIN_STATUS_LATE_FEE_RUN_NOTHING_TO_CALCULATE)) {
    return new LateFeeRunError('nothing-to-calculate');
  }
  if (errorCodes.includes(FIN_STATUS_LATE_FEE_IS_OFF)) {
    return new LateFeeRunError('late-fee-off');
  }
  if (errorCodes.includes(FIN_STATUS_CHARGE_PLAN_NOT_FOUND)) {
    return new LateFeeRunError('charge-plan-not-found');
  }
  if (errorCodes.includes(FIN_STATUS_DOCUMENT_DATE_IS_NOT_VALID)) {
    return new LateFeeRunError('missing-fields');
  }
  if (errorCodes.includes(FIN_STATUS_ACCOUNTING_ENTITY_NOT_FOUND)) {
    return new LateFeeRunError('accounting-entity-not-found');
  }
  if (errorCodes.includes(FIN_STATUS_LATE_FEE_RUN_NOT_FOUND)) {
    return new LateFeeRunError('not-found');
  }
  return new LateFeeRunError('unknown');
}

export async function getLateFeeRunById(id: string): Promise<LateFeeRunFullInfo | null> {
  const { data } = await httpClient.get<LateFeeRunFullInfo | null>(LATE_FEE_RUN_ENDPOINTS.getById(id));
  return data ?? null;
}

function validatePayload(payload: LateFeeRunRequestPayload) {
  if (!payload.accountingEntityId || !payload.documentDate) {
    throw new LateFeeRunError('missing-fields');
  }
}

export async function previewLateFeeRun(payload: LateFeeRunRequestPayload): Promise<LateFeeRunPreview> {
  validatePayload(payload);
  try {
    const { data } = await httpClient.post<DtoReceivable[]>(LATE_FEE_RUN_ENDPOINTS.preview, payload);
    return mapLateFeeRunPreview(data);
  } catch (err) {
    throw mapLateFeeRunError(err);
  }
}

export async function addLateFeeRun(payload: LateFeeRunRequestPayload): Promise<LateFeeRunFullInfo> {
  validatePayload(payload);
  try {
    const { data } = await httpClient.post<LateFeeRunFullInfo>(LATE_FEE_RUN_ENDPOINTS.add, payload);
    return data;
  } catch (err) {
    throw mapLateFeeRunError(err);
  }
}

export async function cancelLateFeeRun(id: string, cancelReason: string, reversalDate: string | null): Promise<void> {
  if (!cancelReason.trim()) {
    throw new LateFeeRunError('cancel-reason-required');
  }
  try {
    await httpClient.post(LATE_FEE_RUN_ENDPOINTS.cancel, { id, cancelReason, reversalDate });
  } catch (err) {
    throw mapLateFeeRunError(err);
  }
}
