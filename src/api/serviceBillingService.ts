import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { SERVICE_BILLING_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import {
  ServiceBillingError,
  type ServiceBillingFullInfo,
  type ServiceBillingRequestPayload,
  type ServiceBillingStatus,
} from '../types/serviceBilling';

const FIN_STATUS_SERVICE_BILLING_NOT_FOUND = 38210;
const FIN_STATUS_SERVICE_BILLING_IS_NOT_VALID = 38211;
const FIN_STATUS_SERVICE_BILLING_IS_SETTLED_AND_CAN_NOT_BE_CANCELLED = 38212;
const FIN_STATUS_SERVICE_BILLING_TYPE_NOT_FOUND = 38200;
const FIN_STATUS_SERVICE_BILLING_TYPE_IS_NOT_ACTIVE = 38203;
const FIN_STATUS_DOCUMENT_DATE_IS_NOT_VALID = 37613;
const FIN_STATUS_PARTY_NOT_FOUND = 37400;
const FIN_STATUS_PARTY_IS_NOT_ACTIVE = 37409;
const FIN_STATUS_FUND_NOT_FOUND = 37210;
const FIN_STATUS_FUND_IS_NOT_ACTIVE = 37214;
const FIN_STATUS_COST_CATEGORY_NOT_FOUND = 37220;
const FIN_STATUS_COST_CATEGORY_IS_NOT_ACTIVE = 37228;
const FIN_STATUS_COST_CATEGORY_IS_NOT_LEAF = 37227;
const FIN_STATUS_CANCEL_REASON_IS_REQUIRED = 37612;

/** GridView row — PascalCase, same convention as every other GridView row. */
export interface ServiceBillingGridRow {
  Id: string;
  DocumentNumber: string;
  DocumentDate: string;
  PartyDisplayName: string;
  ServiceBillingTypeTitle: string;
  Title: string;
  Amount: number;
  OpenAmount: number;
  Status: ServiceBillingStatus;
}

function mapServiceBillingError(err: unknown): ServiceBillingError {
  if (!(err instanceof AxiosError)) {
    return new ServiceBillingError('unknown');
  }
  if (!err.response) {
    return new ServiceBillingError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_SERVICE_BILLING_IS_SETTLED_AND_CAN_NOT_BE_CANCELLED)) {
    return new ServiceBillingError('already-settled');
  }
  if (errorCodes.includes(FIN_STATUS_CANCEL_REASON_IS_REQUIRED)) {
    return new ServiceBillingError('cancel-reason-required');
  }
  if (errorCodes.includes(FIN_STATUS_DOCUMENT_DATE_IS_NOT_VALID)) {
    return new ServiceBillingError('document-date-invalid');
  }
  if (errorCodes.includes(FIN_STATUS_SERVICE_BILLING_TYPE_IS_NOT_ACTIVE)) {
    return new ServiceBillingError('type-inactive');
  }
  if (errorCodes.includes(FIN_STATUS_SERVICE_BILLING_TYPE_NOT_FOUND)) {
    return new ServiceBillingError('type-not-found');
  }
  if (errorCodes.includes(FIN_STATUS_PARTY_IS_NOT_ACTIVE)) {
    return new ServiceBillingError('party-inactive');
  }
  if (errorCodes.includes(FIN_STATUS_PARTY_NOT_FOUND)) {
    return new ServiceBillingError('party-not-found');
  }
  if (errorCodes.includes(FIN_STATUS_FUND_IS_NOT_ACTIVE)) {
    return new ServiceBillingError('fund-inactive');
  }
  if (errorCodes.includes(FIN_STATUS_FUND_NOT_FOUND)) {
    return new ServiceBillingError('fund-not-found');
  }
  if (errorCodes.includes(FIN_STATUS_COST_CATEGORY_IS_NOT_LEAF)) {
    return new ServiceBillingError('cost-category-not-leaf');
  }
  if (errorCodes.includes(FIN_STATUS_COST_CATEGORY_IS_NOT_ACTIVE)) {
    return new ServiceBillingError('cost-category-inactive');
  }
  if (errorCodes.includes(FIN_STATUS_COST_CATEGORY_NOT_FOUND)) {
    return new ServiceBillingError('cost-category-not-found');
  }
  if (errorCodes.includes(FIN_STATUS_SERVICE_BILLING_NOT_FOUND)) {
    return new ServiceBillingError('not-found');
  }
  if (errorCodes.includes(FIN_STATUS_SERVICE_BILLING_IS_NOT_VALID)) {
    return new ServiceBillingError('missing-fields');
  }
  return new ServiceBillingError('unknown');
}

export async function getServiceBillingById(id: string): Promise<ServiceBillingFullInfo | null> {
  const { data } = await httpClient.get<ServiceBillingFullInfo | null>(SERVICE_BILLING_ENDPOINTS.getById(id));
  return data ?? null;
}

function validatePayload(payload: ServiceBillingRequestPayload) {
  if (
    !payload.accountingEntityId ||
    !payload.documentDate ||
    !payload.serviceBillingTypeId ||
    !payload.partyId ||
    !payload.amount ||
    (!payload.buildingUnitId && !payload.buildingSpaceId)
  ) {
    throw new ServiceBillingError('missing-fields');
  }
}

export async function addServiceBilling(payload: ServiceBillingRequestPayload): Promise<ServiceBillingFullInfo> {
  validatePayload(payload);
  try {
    const { data } = await httpClient.post<ServiceBillingFullInfo>(SERVICE_BILLING_ENDPOINTS.add, payload);
    return data;
  } catch (err) {
    throw mapServiceBillingError(err);
  }
}

export async function cancelServiceBilling(id: string, cancelReason: string, reversalDate: string | null): Promise<void> {
  if (!cancelReason.trim()) {
    throw new ServiceBillingError('cancel-reason-required');
  }
  try {
    await httpClient.post(SERVICE_BILLING_ENDPOINTS.cancel, { id, cancelReason, reversalDate });
  } catch (err) {
    throw mapServiceBillingError(err);
  }
}
