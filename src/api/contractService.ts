import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { CONTRACT_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { ContractError, type ContractFullInfo, type ContractPayload, type ContractWithChildren } from '../types/contract';

const CONTRACT_STATUS_CONTRACT_NOT_FOUND_IN_DATABASE = 4600;
const CONTRACT_STATUS_CONTRACT_TITLE_IS_NOT_VALID = 4601;
const CONTRACT_STATUS_CONTRACT_NUMBER_IS_NOT_VALID = 4602;
const CONTRACT_STATUS_CONTRACT_NUMBER_ALREADY_EXIST_IN_DATABASE = 4603;
const CONTRACT_STATUS_CONTRACT_TARGET_IS_NOT_VALID = 4604;
const CONTRACT_STATUS_CONTRACT_START_DATE_IS_NOT_VALID = 4605;
const CONTRACT_STATUS_CONTRACT_END_DATE_MUST_BE_AFTER_START_DATE = 4606;
const CONTRACT_STATUS_CONTRACT_PERSON_NOT_FOUND = 4607;
const CONTRACT_STATUS_CONTRACT_PERSON_ALREADY_EXIST_IN_DATABASE = 4608;
const CONTRACT_STATUS_CONTRACT_PERSON_PERSON_ID_IS_NOT_VALID = 4609;
const CONTRACT_STATUS_CONTRACT_PAYMENT_DETAIL_NOT_FOUND = 4610;
const CONTRACT_STATUS_CONTRACT_PAYMENT_DETAIL_AMOUNT_IS_NOT_VALID = 4611;
const CONTRACT_STATUS_CONTRACT_SHARE_UNIT_IS_NOT_VALID = 4612;
const CONTRACT_STATUS_CONTRACT_SHARE_UNIT_IS_NOT_ALLOWED_FOR_THIS_CONTRACT_TYPE = 4613;
const CONTRACT_STATUS_CONTRACT_PERSON_SHARE_AMOUNT_IS_ONLY_ALLOWED_FOR_PRINCIPAL = 4614;
const CONTRACT_STATUS_CONTRACT_PERSON_SHARE_AMOUNT_REQUIRES_CONTRACT_SHARE_UNIT = 4615;
const CONTRACT_STATUS_CONTRACT_PERSON_SHARE_AMOUNT_IS_NOT_VALID = 4616;
const CONTRACT_STATUS_CONTRACT_PERSON_SHARE_AMOUNT_TOTAL_IS_MORE_THAN_SHARE_UNIT_TOTAL = 4617;
const CONTRACT_STATUS_CONTRACT_SHARE_UNIT_CAN_NOT_BE_CHANGED = 4618;
const CONTRACT_STATUS_CONTRACT_PERSON_ROLE_IS_NOT_ALLOWED_FOR_THIS_CONTRACT_TYPE = 4619;
const CONTRACT_STATUS_CONTRACT_USAGE_PERIOD_OVERLAPS_ANOTHER_USAGE_CONTRACT = 4620;
const CONTRACT_STATUS_CONTRACT_TYPE_IS_NOT_VALID = 4621;
const CONTRACT_STATUS_CONTRACT_TARGET_SPACE_MUST_BE_EXCLUSIVE = 4622;

/**
 * GridViewData rows come back PascalCase (unlike every other endpoint in this
 * app, which is camelCase) and use "" instead of null for empty nvarchar
 * fields — this maps that shape to the rest of the app's convention.
 */
export interface ContractGridRow {
  Id: string;
  Title: string;
  ContractNumber: string;
  ContractType: number;
  BuildingUnitId: string | null;
  BuildingSpaceId: string | null;
  StartDate: string;
  EndDate: string;
  Description: string;
  ShareUnit: number | null;
  BuildingUnitTitle: string;
  BuildingSpaceTitle: string;
  BuildingId: string;
  BuildingTitle: string;
  BuildingNumber: number;
  ContractPersonCount: number;
}

function emptyToNull(value: string): string | null {
  return value === '' ? null : value;
}

export function mapContractGridRow(row: ContractGridRow): ContractFullInfo {
  return {
    id: row.Id,
    title: row.Title,
    contractNumber: row.ContractNumber,
    contractType: row.ContractType as ContractFullInfo['contractType'],
    buildingUnitId: row.BuildingUnitId,
    buildingSpaceId: row.BuildingSpaceId,
    startDate: row.StartDate,
    endDate: emptyToNull(row.EndDate),
    description: emptyToNull(row.Description),
    shareUnit: row.ShareUnit as ContractFullInfo['shareUnit'],
    buildingUnitTitle: emptyToNull(row.BuildingUnitTitle),
    buildingSpaceTitle: emptyToNull(row.BuildingSpaceTitle),
    buildingId: row.BuildingId,
    buildingTitle: row.BuildingTitle,
    buildingNumber: row.BuildingNumber,
    contractPersonCount: row.ContractPersonCount,
  };
}

function mapContractError(err: unknown): ContractError {
  if (!(err instanceof AxiosError)) {
    return new ContractError('unknown');
  }
  if (!err.response) {
    return new ContractError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_NOT_FOUND_IN_DATABASE)) {
    return new ContractError('not-found');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_TITLE_IS_NOT_VALID)) {
    return new ContractError('title-invalid');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_NUMBER_IS_NOT_VALID)) {
    return new ContractError('number-invalid');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_NUMBER_ALREADY_EXIST_IN_DATABASE)) {
    return new ContractError('number-already-exists');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_TARGET_IS_NOT_VALID)) {
    return new ContractError('target-invalid');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_START_DATE_IS_NOT_VALID)) {
    return new ContractError('start-date-invalid');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_END_DATE_MUST_BE_AFTER_START_DATE)) {
    return new ContractError('end-date-before-start-date');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_PERSON_NOT_FOUND)) {
    return new ContractError('person-not-found');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_PERSON_ALREADY_EXIST_IN_DATABASE)) {
    return new ContractError('person-already-exists');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_PERSON_PERSON_ID_IS_NOT_VALID)) {
    return new ContractError('person-id-invalid');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_PAYMENT_DETAIL_NOT_FOUND)) {
    return new ContractError('payment-detail-not-found');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_PAYMENT_DETAIL_AMOUNT_IS_NOT_VALID)) {
    return new ContractError('payment-detail-amount-invalid');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_SHARE_UNIT_IS_NOT_VALID)) {
    return new ContractError('share-unit-invalid');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_SHARE_UNIT_IS_NOT_ALLOWED_FOR_THIS_CONTRACT_TYPE)) {
    return new ContractError('share-unit-not-allowed-for-type');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_PERSON_SHARE_AMOUNT_IS_ONLY_ALLOWED_FOR_PRINCIPAL)) {
    return new ContractError('share-amount-only-for-principal');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_PERSON_SHARE_AMOUNT_REQUIRES_CONTRACT_SHARE_UNIT)) {
    return new ContractError('share-amount-requires-share-unit');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_PERSON_SHARE_AMOUNT_IS_NOT_VALID)) {
    return new ContractError('share-amount-invalid');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_PERSON_SHARE_AMOUNT_TOTAL_IS_MORE_THAN_SHARE_UNIT_TOTAL)) {
    return new ContractError('share-amount-total-exceeds-unit-total');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_SHARE_UNIT_CAN_NOT_BE_CHANGED)) {
    return new ContractError('share-unit-cannot-change');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_PERSON_ROLE_IS_NOT_ALLOWED_FOR_THIS_CONTRACT_TYPE)) {
    return new ContractError('person-role-not-allowed-for-type');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_USAGE_PERIOD_OVERLAPS_ANOTHER_USAGE_CONTRACT)) {
    return new ContractError('usage-period-overlap');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_TYPE_IS_NOT_VALID)) {
    return new ContractError('type-invalid');
  }
  if (errorCodes.includes(CONTRACT_STATUS_CONTRACT_TARGET_SPACE_MUST_BE_EXCLUSIVE)) {
    return new ContractError('target-space-must-be-exclusive');
  }
  return new ContractError('unknown');
}

/** GET /api/core/Contract/GetById/{id} — always includes ContractPersons/PaymentDetails full info. */
export async function getContractById(id: string): Promise<ContractWithChildren | null> {
  const { data } = await httpClient.get<ContractWithChildren | null>(CONTRACT_ENDPOINTS.getById(id));
  return data ?? null;
}

function validatePayload(payload: ContractPayload): void {
  const hasUnit = !!payload.buildingUnitId;
  const hasSpace = !!payload.buildingSpaceId;
  if (!payload.title.trim() || !payload.contractNumber.trim() || hasUnit === hasSpace) {
    throw new ContractError('missing-fields');
  }
}

export async function aggregateSaveContract(payload: ContractPayload): Promise<void> {
  validatePayload(payload);

  try {
    await httpClient.post(CONTRACT_ENDPOINTS.aggregateSave, payload);
  } catch (err) {
    throw mapContractError(err);
  }
}

export async function aggregateUpdateContract(payload: ContractPayload): Promise<void> {
  validatePayload(payload);

  try {
    await httpClient.post(CONTRACT_ENDPOINTS.aggregateUpdate, payload);
  } catch (err) {
    throw mapContractError(err);
  }
}

export async function deleteContract(id: string): Promise<void> {
  try {
    await httpClient.post(CONTRACT_ENDPOINTS.aggregateDelete(id));
  } catch (err) {
    throw mapContractError(err);
  }
}
