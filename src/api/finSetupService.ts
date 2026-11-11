import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { FIN_SETUP_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import {
  FinSetupError,
  type FinBulkUserCreateResult,
  type FinMenuBundleApplyPayload,
  type FinQuickSetupPayload,
  type FinQuickSetupResult,
  type FinResidentUsersPayload,
} from '../types/finSetup';

const FIN_STATUS_OPERATION_IS_ONLY_ALLOWED_IN_ADVANCED_ACCOUNTING_MODE = 37000;
const FIN_STATUS_QUICK_SETUP_IS_NOT_VALID = 38100;
const FIN_STATUS_QUICK_SETUP_BUILDING_ALREADY_HAS_ACCOUNTING_ENTITY = 38101;
const FIN_STATUS_QUICK_SETUP_PARTIALLY_CREATED = 38102;
const FIN_STATUS_RESIDENT_USERS_NO_PRINCIPAL_FOUND = 38130;

function mapFinSetupError(err: unknown): FinSetupError {
  if (!(err instanceof AxiosError)) {
    return new FinSetupError('unknown');
  }
  if (!err.response) {
    return new FinSetupError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_QUICK_SETUP_PARTIALLY_CREATED)) {
    return new FinSetupError('partially-created');
  }
  if (errorCodes.includes(FIN_STATUS_QUICK_SETUP_BUILDING_ALREADY_HAS_ACCOUNTING_ENTITY)) {
    return new FinSetupError('building-already-has-accounting-entity');
  }
  if (errorCodes.includes(FIN_STATUS_RESIDENT_USERS_NO_PRINCIPAL_FOUND)) {
    return new FinSetupError('no-principal-found');
  }
  if (errorCodes.includes(FIN_STATUS_OPERATION_IS_ONLY_ALLOWED_IN_ADVANCED_ACCOUNTING_MODE)) {
    return new FinSetupError('advanced-mode-only');
  }
  if (errorCodes.includes(FIN_STATUS_QUICK_SETUP_IS_NOT_VALID)) {
    return new FinSetupError('missing-fields');
  }
  return new FinSetupError('unknown');
}

export async function quickSetup(payload: FinQuickSetupPayload): Promise<FinQuickSetupResult> {
  if (
    !payload.title.trim() ||
    payload.buildingIds.length === 0 ||
    !payload.fiscalYearTitle.trim() ||
    !payload.fiscalYearStartDate ||
    !payload.fiscalYearEndDate ||
    !payload.bankAccountTitle.trim() ||
    payload.monthlyChargeAmount <= 0
  ) {
    throw new FinSetupError('missing-fields');
  }

  try {
    const { data } = await httpClient.post<FinQuickSetupResult>(FIN_SETUP_ENDPOINTS.quickSetup, payload);
    return data;
  } catch (err) {
    throw mapFinSetupError(err);
  }
}

export async function residentUsers(payload: FinResidentUsersPayload): Promise<FinBulkUserCreateResult> {
  if (payload.buildingIds.length === 0 || !payload.userGroupId || !payload.password.trim()) {
    throw new FinSetupError('missing-fields');
  }

  try {
    const { data } = await httpClient.post<FinBulkUserCreateResult>(FIN_SETUP_ENDPOINTS.residentUsers, payload);
    return data;
  } catch (err) {
    throw mapFinSetupError(err);
  }
}

export async function applyMenuBundle(payload: FinMenuBundleApplyPayload): Promise<void> {
  if (!payload.userGroupId) {
    throw new FinSetupError('missing-fields');
  }

  try {
    await httpClient.post(FIN_SETUP_ENDPOINTS.menuBundleApply, payload);
  } catch (err) {
    throw mapFinSetupError(err);
  }
}
