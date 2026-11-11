import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { CHARGE_COEFFICIENT_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { ChargeCoefficientError, type ChargeCoefficient, type ChargeCoefficientPayload } from '../types/chargeCoefficient';

const FIN_STATUS_CHARGE_COEFFICIENT_NOT_FOUND = 37820;
const FIN_STATUS_CHARGE_COEFFICIENT_IS_NOT_VALID = 37821;

function mapChargeCoefficientError(err: unknown): ChargeCoefficientError {
  if (!(err instanceof AxiosError)) {
    return new ChargeCoefficientError('unknown');
  }
  if (!err.response) {
    return new ChargeCoefficientError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_CHARGE_COEFFICIENT_IS_NOT_VALID)) {
    return new ChargeCoefficientError('missing-fields');
  }
  if (errorCodes.includes(FIN_STATUS_CHARGE_COEFFICIENT_NOT_FOUND)) {
    return new ChargeCoefficientError('not-found');
  }
  return new ChargeCoefficientError('unknown');
}

export async function searchChargeCoefficientsByComponent(chargeComponentId: string): Promise<ChargeCoefficient[]> {
  const { data } = await httpClient.post<ChargeCoefficient[]>(CHARGE_COEFFICIENT_ENDPOINTS.search, {
    filter: { chargeComponentIds: [chargeComponentId] },
  });
  return data;
}

export async function saveChargeCoefficient(payload: ChargeCoefficientPayload, isEdit: boolean): Promise<void> {
  if (!payload.chargeComponentId) {
    throw new ChargeCoefficientError('missing-fields');
  }
  if (payload.coefficientKind === 1 && (payload.unitType === null || payload.floorActualNumber !== null)) {
    throw new ChargeCoefficientError('missing-fields');
  }
  if (payload.coefficientKind === 2 && (payload.floorActualNumber === null || payload.unitType !== null)) {
    throw new ChargeCoefficientError('missing-fields');
  }

  try {
    await httpClient.post(isEdit ? CHARGE_COEFFICIENT_ENDPOINTS.update : CHARGE_COEFFICIENT_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapChargeCoefficientError(err);
  }
}

export async function deleteChargeCoefficient(id: string): Promise<void> {
  try {
    await httpClient.post(CHARGE_COEFFICIENT_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapChargeCoefficientError(err);
  }
}
