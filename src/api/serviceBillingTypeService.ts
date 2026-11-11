import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { SERVICE_BILLING_TYPE_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { ServiceBillingTypeError, type ServiceBillingTypePayload } from '../types/serviceBillingType';

const FIN_STATUS_SERVICE_BILLING_TYPE_NOT_FOUND = 38200;
const FIN_STATUS_SERVICE_BILLING_TYPE_IS_NOT_VALID = 38201;
const FIN_STATUS_SERVICE_BILLING_TYPE_TITLE_MUST_BE_UNIQUE = 38202;
const FIN_STATUS_COST_CATEGORY_IS_NOT_LEAF = 37227;

/** GridView row — PascalCase, same convention as every other GridView row. */
export interface ServiceBillingTypeGridRow {
  Id: string;
  AccountingEntityId: string;
  Title: string;
  DefaultAmount: number | null;
  FundId: string;
  FundTitle: string;
  CostCategoryId: string;
  IsActive: boolean;
}

function mapServiceBillingTypeError(err: unknown): ServiceBillingTypeError {
  if (!(err instanceof AxiosError)) {
    return new ServiceBillingTypeError('unknown');
  }
  if (!err.response) {
    return new ServiceBillingTypeError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_SERVICE_BILLING_TYPE_TITLE_MUST_BE_UNIQUE)) {
    return new ServiceBillingTypeError('title-must-be-unique');
  }
  if (errorCodes.includes(FIN_STATUS_COST_CATEGORY_IS_NOT_LEAF)) {
    return new ServiceBillingTypeError('cost-category-not-leaf');
  }
  if (errorCodes.includes(FIN_STATUS_SERVICE_BILLING_TYPE_IS_NOT_VALID)) {
    return new ServiceBillingTypeError('missing-fields');
  }
  if (errorCodes.includes(FIN_STATUS_SERVICE_BILLING_TYPE_NOT_FOUND)) {
    return new ServiceBillingTypeError('not-found');
  }
  return new ServiceBillingTypeError('unknown');
}

export async function saveServiceBillingType(payload: ServiceBillingTypePayload, isEdit: boolean): Promise<void> {
  if (!payload.accountingEntityId || !payload.title.trim() || !payload.fundId) {
    throw new ServiceBillingTypeError('missing-fields');
  }

  try {
    await httpClient.post(isEdit ? SERVICE_BILLING_TYPE_ENDPOINTS.update : SERVICE_BILLING_TYPE_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapServiceBillingTypeError(err);
  }
}

export async function deleteServiceBillingType(id: string): Promise<void> {
  try {
    await httpClient.post(SERVICE_BILLING_TYPE_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapServiceBillingTypeError(err);
  }
}
