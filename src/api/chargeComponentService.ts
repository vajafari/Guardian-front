import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { CHARGE_COMPONENT_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { ChargeComponentError, type ChargeComponentFullInfo, type ChargeComponentPayload } from '../types/chargeComponent';

const FIN_STATUS_CHARGE_COMPONENT_NOT_FOUND = 37810;
const FIN_STATUS_CHARGE_COMPONENT_IS_NOT_VALID = 37811;
const FIN_STATUS_CHARGE_COMPONENT_BUILDING_DOES_NOT_BELONG_TO_ACCOUNTING_ENTITY = 37813;
const FIN_STATUS_CHARGE_COMPONENT_IS_USED_AND_CAN_NOT_BE_DELETED = 37814;
const FIN_STATUS_COST_CATEGORY_IS_NOT_LEAF = 37227;

function mapChargeComponentError(err: unknown): ChargeComponentError {
  if (!(err instanceof AxiosError)) {
    return new ChargeComponentError('unknown');
  }
  if (!err.response) {
    return new ChargeComponentError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_CHARGE_COMPONENT_BUILDING_DOES_NOT_BELONG_TO_ACCOUNTING_ENTITY)) {
    return new ChargeComponentError('building-mismatch');
  }
  if (errorCodes.includes(FIN_STATUS_CHARGE_COMPONENT_IS_USED_AND_CAN_NOT_BE_DELETED)) {
    return new ChargeComponentError('is-used-cannot-delete');
  }
  if (errorCodes.includes(FIN_STATUS_COST_CATEGORY_IS_NOT_LEAF)) {
    return new ChargeComponentError('cost-category-not-leaf');
  }
  if (errorCodes.includes(FIN_STATUS_CHARGE_COMPONENT_IS_NOT_VALID)) {
    return new ChargeComponentError('missing-fields');
  }
  if (errorCodes.includes(FIN_STATUS_CHARGE_COMPONENT_NOT_FOUND)) {
    return new ChargeComponentError('not-found');
  }
  return new ChargeComponentError('unknown');
}

export async function searchChargeComponentsByPlan(chargePlanId: string): Promise<ChargeComponentFullInfo[]> {
  const { data } = await httpClient.post<ChargeComponentFullInfo[]>(CHARGE_COMPONENT_ENDPOINTS.search, {
    filter: { chargePlanIds: [chargePlanId] },
  });
  return data;
}

export async function saveChargeComponent(payload: ChargeComponentPayload, isEdit: boolean): Promise<void> {
  if (!payload.title.trim() || !payload.chargePlanId || !payload.costCategoryId || !payload.fundId) {
    throw new ChargeComponentError('missing-fields');
  }
  if (payload.modelKind === 1 && (payload.amount === null || payload.amount <= 0)) {
    throw new ChargeComponentError('missing-fields');
  }

  try {
    await httpClient.post(isEdit ? CHARGE_COMPONENT_ENDPOINTS.update : CHARGE_COMPONENT_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapChargeComponentError(err);
  }
}

export async function deleteChargeComponent(id: string): Promise<void> {
  try {
    await httpClient.post(CHARGE_COMPONENT_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapChargeComponentError(err);
  }
}
