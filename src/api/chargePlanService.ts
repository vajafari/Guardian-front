import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { CHARGE_PLAN_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { ChargePlanError, type ChargePlanFullInfo, type ChargePlanPayload } from '../types/chargePlan';
import type { LateFeeMode } from '../types/finSetup';

const FIN_STATUS_CHARGE_PLAN_NOT_FOUND = 37800;
const FIN_STATUS_CHARGE_PLAN_ALREADY_EXISTS = 37801;
const FIN_STATUS_CHARGE_PLAN_IS_NOT_VALID = 37802;
const FIN_STATUS_CHARGE_PLAN_HAS_ISSUES_AND_CAN_NOT_BE_DELETED = 37803;

/** GridView row — PascalCase, same convention as every other GridView row. */
export interface ChargePlanGridRow {
  Id: string;
  AccountingEntityId: string;
  AccountingEntityTitle: string;
  DueDay: number;
  GraceDays: number;
  LateFeeMode: LateFeeMode;
  LateFeeFundTitle: string;
  RentIncomeFundTitle: string;
}

function mapChargePlanError(err: unknown): ChargePlanError {
  if (!(err instanceof AxiosError)) {
    return new ChargePlanError('unknown');
  }
  if (!err.response) {
    return new ChargePlanError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_CHARGE_PLAN_ALREADY_EXISTS)) {
    return new ChargePlanError('already-exists');
  }
  if (errorCodes.includes(FIN_STATUS_CHARGE_PLAN_HAS_ISSUES_AND_CAN_NOT_BE_DELETED)) {
    return new ChargePlanError('has-issues-cannot-delete');
  }
  if (errorCodes.includes(FIN_STATUS_CHARGE_PLAN_IS_NOT_VALID)) {
    return new ChargePlanError('missing-fields');
  }
  if (errorCodes.includes(FIN_STATUS_CHARGE_PLAN_NOT_FOUND)) {
    return new ChargePlanError('not-found');
  }
  return new ChargePlanError('unknown');
}

export async function getChargePlanById(id: string): Promise<ChargePlanFullInfo | null> {
  const { data } = await httpClient.get<ChargePlanFullInfo | null>(CHARGE_PLAN_ENDPOINTS.getById(id));
  return data ?? null;
}

export async function saveChargePlan(payload: ChargePlanPayload, isEdit: boolean): Promise<void> {
  if (!payload.accountingEntityId || !payload.lateFeeFundId || !payload.rentIncomeFundId) {
    throw new ChargePlanError('missing-fields');
  }
  if (payload.autoCreateResidentUser && !payload.residentUserGroupId) {
    throw new ChargePlanError('missing-fields');
  }

  try {
    await httpClient.post(isEdit ? CHARGE_PLAN_ENDPOINTS.update : CHARGE_PLAN_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapChargePlanError(err);
  }
}

export async function deleteChargePlan(id: string): Promise<void> {
  try {
    await httpClient.post(CHARGE_PLAN_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapChargePlanError(err);
  }
}
