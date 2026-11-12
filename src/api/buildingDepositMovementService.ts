import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { BUILDING_DEPOSIT_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import {
  BuildingDepositMovementError,
  type BuildingDepositMovementFullInfo,
  type BuildingDepositMovementRequestPayload,
} from '../types/buildingDepositMovement';

const FIN_STATUS_BUILDING_DEPOSIT_MOVEMENT_IS_NOT_VALID = 37942;
const FIN_STATUS_BUILDING_DEPOSIT_MOVEMENT_NOT_FOUND = 37943;
const FIN_STATUS_BUILDING_DEPOSIT_MOVEMENT_CAN_NOT_BE_CANCELLED = 37945;
const FIN_STATUS_CANCEL_REASON_IS_REQUIRED = 37612;

function mapBuildingDepositMovementError(err: unknown): BuildingDepositMovementError {
  if (!(err instanceof AxiosError)) {
    return new BuildingDepositMovementError('unknown');
  }
  if (!err.response) {
    return new BuildingDepositMovementError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_CANCEL_REASON_IS_REQUIRED)) {
    return new BuildingDepositMovementError('cancel-reason-required');
  }
  if (errorCodes.includes(FIN_STATUS_BUILDING_DEPOSIT_MOVEMENT_CAN_NOT_BE_CANCELLED)) {
    return new BuildingDepositMovementError('can-not-cancel');
  }
  if (errorCodes.includes(FIN_STATUS_BUILDING_DEPOSIT_MOVEMENT_IS_NOT_VALID)) {
    return new BuildingDepositMovementError('missing-fields');
  }
  if (errorCodes.includes(FIN_STATUS_BUILDING_DEPOSIT_MOVEMENT_NOT_FOUND)) {
    return new BuildingDepositMovementError('not-found');
  }
  return new BuildingDepositMovementError('unknown');
}

function validatePayload(payload: BuildingDepositMovementRequestPayload) {
  if (!payload.buildingDepositId || !payload.documentDate || !payload.movementKind || !payload.amount) {
    throw new BuildingDepositMovementError('missing-fields');
  }
  if ((payload.movementKind === 1 || payload.movementKind === 2) && !payload.cashAccountId) {
    throw new BuildingDepositMovementError('missing-fields');
  }
  if (payload.movementKind === 3 && !payload.fundId) {
    throw new BuildingDepositMovementError('missing-fields');
  }
  if (payload.movementKind === 4 && payload.settlements.length === 0) {
    throw new BuildingDepositMovementError('missing-fields');
  }
}

export async function addBuildingDepositMovement(payload: BuildingDepositMovementRequestPayload): Promise<BuildingDepositMovementFullInfo> {
  validatePayload(payload);
  try {
    const { data } = await httpClient.post<BuildingDepositMovementFullInfo>(BUILDING_DEPOSIT_ENDPOINTS.movementAdd, payload);
    return data;
  } catch (err) {
    throw mapBuildingDepositMovementError(err);
  }
}

export async function cancelBuildingDepositMovement(id: string, cancelReason: string, reversalDate: string | null): Promise<void> {
  if (!cancelReason.trim()) {
    throw new BuildingDepositMovementError('cancel-reason-required');
  }
  try {
    await httpClient.post(BUILDING_DEPOSIT_ENDPOINTS.movementCancel, { id, cancelReason, reversalDate });
  } catch (err) {
    throw mapBuildingDepositMovementError(err);
  }
}
