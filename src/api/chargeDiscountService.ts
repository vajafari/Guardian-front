import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { CHARGE_DISCOUNT_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { ChargeDiscountError, type ChargeDiscount, type ChargeDiscountPayload } from '../types/chargeDiscount';

const FIN_STATUS_CHARGE_DISCOUNT_NOT_FOUND = 37825;
const FIN_STATUS_CHARGE_DISCOUNT_IS_NOT_VALID = 37826;
const FIN_STATUS_CHARGE_DISCOUNT_OVERLAPS_ANOTHER_DISCOUNT = 37827;

function mapChargeDiscountError(err: unknown): ChargeDiscountError {
  if (!(err instanceof AxiosError)) {
    return new ChargeDiscountError('unknown');
  }
  if (!err.response) {
    return new ChargeDiscountError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_CHARGE_DISCOUNT_OVERLAPS_ANOTHER_DISCOUNT)) {
    return new ChargeDiscountError('overlaps-another-discount');
  }
  if (errorCodes.includes(FIN_STATUS_CHARGE_DISCOUNT_IS_NOT_VALID)) {
    return new ChargeDiscountError('missing-fields');
  }
  if (errorCodes.includes(FIN_STATUS_CHARGE_DISCOUNT_NOT_FOUND)) {
    return new ChargeDiscountError('not-found');
  }
  return new ChargeDiscountError('unknown');
}

export async function searchChargeDiscountsByPlan(chargePlanId: string): Promise<ChargeDiscount[]> {
  const { data } = await httpClient.post<ChargeDiscount[]>(CHARGE_DISCOUNT_ENDPOINTS.search, {
    filter: { chargePlanIds: [chargePlanId] },
  });
  return data;
}

export async function saveChargeDiscount(payload: ChargeDiscountPayload, isEdit: boolean): Promise<void> {
  if (!payload.chargePlanId || (!payload.buildingUnitId && !payload.buildingSpaceId) || !payload.reason.trim() || !payload.validFrom) {
    throw new ChargeDiscountError('missing-fields');
  }
  if (payload.coefficient < 0 || payload.coefficient > 1) {
    throw new ChargeDiscountError('missing-fields');
  }

  try {
    await httpClient.post(isEdit ? CHARGE_DISCOUNT_ENDPOINTS.update : CHARGE_DISCOUNT_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapChargeDiscountError(err);
  }
}

export async function deleteChargeDiscount(id: string): Promise<void> {
  try {
    await httpClient.post(CHARGE_DISCOUNT_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapChargeDiscountError(err);
  }
}
