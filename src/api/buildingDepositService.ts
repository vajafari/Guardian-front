import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { BUILDING_DEPOSIT_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { BuildingDepositError, type BuildingDepositFullInfo, type BuildingDepositKind, type BuildingDepositPayload } from '../types/buildingDeposit';

const FIN_STATUS_BUILDING_DEPOSIT_NOT_FOUND = 37940;
const FIN_STATUS_BUILDING_DEPOSIT_IS_NOT_VALID = 37941;
const FIN_STATUS_BUILDING_DEPOSIT_HAS_MOVEMENTS_AND_CAN_NOT_BE_DELETED = 37944;
const FIN_STATUS_BUILDING_DEPOSIT_CAN_NOT_BE_CHANGED_AFTER_MOVEMENTS = 37946;

/** GridView row — PascalCase, same convention as every other GridView row. */
export interface BuildingDepositGridRow {
  Id: string;
  Title: string;
  PartyDisplayName: string;
  BuildingUnitTitle: string;
  BuildingSpaceTitle: string;
  DepositKind: BuildingDepositKind;
  HeldAmount: number;
}

function mapBuildingDepositError(err: unknown): BuildingDepositError {
  if (!(err instanceof AxiosError)) {
    return new BuildingDepositError('unknown');
  }
  if (!err.response) {
    return new BuildingDepositError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_BUILDING_DEPOSIT_HAS_MOVEMENTS_AND_CAN_NOT_BE_DELETED)) {
    return new BuildingDepositError('has-movements-can-not-delete');
  }
  if (errorCodes.includes(FIN_STATUS_BUILDING_DEPOSIT_CAN_NOT_BE_CHANGED_AFTER_MOVEMENTS)) {
    return new BuildingDepositError('can-not-change-after-movements');
  }
  if (errorCodes.includes(FIN_STATUS_BUILDING_DEPOSIT_IS_NOT_VALID)) {
    return new BuildingDepositError('missing-fields');
  }
  if (errorCodes.includes(FIN_STATUS_BUILDING_DEPOSIT_NOT_FOUND)) {
    return new BuildingDepositError('not-found');
  }
  return new BuildingDepositError('unknown');
}

export async function getBuildingDepositById(id: string): Promise<BuildingDepositFullInfo | null> {
  const { data } = await httpClient.get<BuildingDepositFullInfo | null>(BUILDING_DEPOSIT_ENDPOINTS.getById(id));
  return data ?? null;
}

function validatePayload(payload: BuildingDepositPayload) {
  if (!payload.accountingEntityId || !payload.partyId || !payload.depositKind || !payload.title.trim()) {
    throw new BuildingDepositError('missing-fields');
  }
  if (payload.buildingUnitId && payload.buildingSpaceId) {
    throw new BuildingDepositError('missing-fields');
  }
}

export async function addBuildingDeposit(payload: BuildingDepositPayload): Promise<BuildingDepositFullInfo> {
  validatePayload(payload);
  try {
    const { data } = await httpClient.post<BuildingDepositFullInfo>(BUILDING_DEPOSIT_ENDPOINTS.add, payload);
    return data;
  } catch (err) {
    throw mapBuildingDepositError(err);
  }
}

export async function updateBuildingDeposit(payload: BuildingDepositPayload): Promise<BuildingDepositFullInfo> {
  validatePayload(payload);
  try {
    const { data } = await httpClient.post<BuildingDepositFullInfo>(BUILDING_DEPOSIT_ENDPOINTS.update, payload);
    return data;
  } catch (err) {
    throw mapBuildingDepositError(err);
  }
}

export async function deleteBuildingDeposit(id: string): Promise<void> {
  try {
    await httpClient.post(BUILDING_DEPOSIT_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapBuildingDepositError(err);
  }
}
