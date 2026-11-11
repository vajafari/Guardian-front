import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { CHARGE_ISSUE_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import {
  ChargeIssueError,
  type ChargeIssueFullInfo,
  type ChargeIssuePreview,
  type ChargeIssueRequestPayload,
  type ChargeIssueStatus,
} from '../types/chargeIssue';

const FIN_STATUS_CHARGE_ISSUE_NOT_FOUND = 37830;
const FIN_STATUS_CHARGE_ISSUE_PERIOD_NOT_FOUND = 37831;
const FIN_STATUS_CHARGE_ISSUE_NOTHING_TO_ISSUE = 37832;
const FIN_STATUS_CHARGE_ISSUE_RECEIVABLE_IS_SETTLED_AND_CAN_NOT_BE_CANCELLED = 37834;
const FIN_STATUS_CHARGE_ISSUE_RECEIVABLE_HAS_LATE_FEE_AND_CAN_NOT_BE_CANCELLED = 37835;
const FIN_STATUS_CANCEL_REASON_IS_REQUIRED = 37612;

/**
 * GridView rows come back PascalCase (unlike every other endpoint in this
 * app, which is camelCase) — same convention as every other GridView row.
 */
export interface ChargeIssueGridRow {
  Id: string;
  DocumentNumber: string;
  AccountingEntityTitle: string;
  FiscalPeriodTitle: string;
  PeriodStart: string;
  DocumentDate: string;
  DueDate: string;
  Status: ChargeIssueStatus;
  ItemCount: number;
  TotalAmount: number;
  ActiveTotalAmount: number;
}

interface ChargeIssuePreviewApiResponse {
  periodStart: string;
  periodEnd: string;
  documentDate: string;
  dueDate: string;
  totalAmount: number;
  components: ChargeIssuePreview['components'];
  receivables: Array<{ amount: number }>;
  lateFees: Array<{ amount: number }>;
}

function mapChargeIssuePreview(data: ChargeIssuePreviewApiResponse): ChargeIssuePreview {
  return {
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    documentDate: data.documentDate,
    dueDate: data.dueDate,
    totalAmount: data.totalAmount,
    components: data.components,
    receivableCount: data.receivables.length,
    receivableTotal: data.receivables.reduce((sum, r) => sum + r.amount, 0),
    lateFeeCount: data.lateFees.length,
    lateFeeTotal: data.lateFees.reduce((sum, r) => sum + r.amount, 0),
  };
}

function mapChargeIssueError(err: unknown): ChargeIssueError {
  if (!(err instanceof AxiosError)) {
    return new ChargeIssueError('unknown');
  }
  if (!err.response) {
    return new ChargeIssueError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_CHARGE_ISSUE_PERIOD_NOT_FOUND)) {
    return new ChargeIssueError('period-not-found');
  }
  if (errorCodes.includes(FIN_STATUS_CHARGE_ISSUE_NOTHING_TO_ISSUE)) {
    return new ChargeIssueError('nothing-to-issue');
  }
  if (
    errorCodes.includes(FIN_STATUS_CHARGE_ISSUE_RECEIVABLE_IS_SETTLED_AND_CAN_NOT_BE_CANCELLED) ||
    errorCodes.includes(FIN_STATUS_CHARGE_ISSUE_RECEIVABLE_HAS_LATE_FEE_AND_CAN_NOT_BE_CANCELLED)
  ) {
    return new ChargeIssueError('cannot-cancel');
  }
  if (errorCodes.includes(FIN_STATUS_CANCEL_REASON_IS_REQUIRED)) {
    return new ChargeIssueError('cancel-reason-required');
  }
  if (errorCodes.includes(FIN_STATUS_CHARGE_ISSUE_NOT_FOUND)) {
    return new ChargeIssueError('not-found');
  }
  return new ChargeIssueError('unknown');
}

export async function getChargeIssueById(id: string): Promise<ChargeIssueFullInfo | null> {
  const { data } = await httpClient.get<ChargeIssueFullInfo | null>(CHARGE_ISSUE_ENDPOINTS.getById(id));
  return data ?? null;
}

function validatePayload(payload: ChargeIssueRequestPayload) {
  if (!payload.accountingEntityId || !payload.fiscalPeriodId) {
    throw new ChargeIssueError('missing-fields');
  }
}

export async function previewChargeIssue(payload: ChargeIssueRequestPayload): Promise<ChargeIssuePreview> {
  validatePayload(payload);
  try {
    const { data } = await httpClient.post<ChargeIssuePreviewApiResponse>(CHARGE_ISSUE_ENDPOINTS.preview, payload);
    return mapChargeIssuePreview(data);
  } catch (err) {
    throw mapChargeIssueError(err);
  }
}

export async function addChargeIssue(payload: ChargeIssueRequestPayload): Promise<ChargeIssueFullInfo> {
  validatePayload(payload);
  try {
    const { data } = await httpClient.post<ChargeIssueFullInfo>(CHARGE_ISSUE_ENDPOINTS.add, payload);
    return data;
  } catch (err) {
    throw mapChargeIssueError(err);
  }
}

export async function cancelChargeIssue(id: string, cancelReason: string, reversalDate: string | null): Promise<void> {
  if (!cancelReason.trim()) {
    throw new ChargeIssueError('cancel-reason-required');
  }
  try {
    await httpClient.post(CHARGE_ISSUE_ENDPOINTS.cancel, { id, cancelReason, reversalDate });
  } catch (err) {
    throw mapChargeIssueError(err);
  }
}
