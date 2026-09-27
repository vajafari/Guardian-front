import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { CONTRACTOR_ENDPOINTS } from './config';
import { ContractorError, type Contractor, type ContractorFullInfo, type ContractorPayload } from '../types/contractor';

/**
 * GridViewData rows come back PascalCase (unlike every other endpoint in this
 * app, which is camelCase) and use "" instead of null for empty fields —
 * this maps that shape to the rest of the app's convention.
 */
interface ContractorGridRow {
  Id: string;
  Title: string;
  StartDate: string;
  EndDate: string;
  IsActive: boolean;
  ContactorType: number;
  SubjectOfActivity: string;
  PhoneNumber: string;
  Address: string;
  Description: string;
  EconomicCode: string;
}

function emptyToNull(value: string): string | null {
  return value === '' ? null : value;
}

function mapGridRow(row: ContractorGridRow): Contractor {
  return {
    id: row.Id,
    title: row.Title,
    startDate: emptyToNull(row.StartDate),
    endDate: emptyToNull(row.EndDate),
    isActive: row.IsActive,
    contactorType: row.ContactorType as Contractor['contactorType'],
    subjectOfActivity: emptyToNull(row.SubjectOfActivity),
    phoneNumber: emptyToNull(row.PhoneNumber),
    address: emptyToNull(row.Address),
    description: emptyToNull(row.Description),
    economicCode: emptyToNull(row.EconomicCode),
  };
}

function mapContractorError(err: unknown): ContractorError {
  if (!(err instanceof AxiosError)) {
    return new ContractorError('unknown');
  }
  if (!err.response) {
    return new ContractorError('network-error');
  }
  return new ContractorError('unknown');
}

export async function listContractors(): Promise<Contractor[]> {
  const { data } = await httpClient.get<{ rows: ContractorGridRow[] }>(CONTRACTOR_ENDPOINTS.gridView);
  return data.rows.map(mapGridRow);
}

export async function getContractorById(id: string): Promise<ContractorFullInfo | null> {
  const { data } = await httpClient.get<ContractorFullInfo | null>(CONTRACTOR_ENDPOINTS.getById(id));
  return data ?? null;
}

export async function addContractor(payload: ContractorPayload): Promise<void> {
  if (!payload.title.trim()) {
    throw new ContractorError('missing-fields');
  }

  try {
    await httpClient.post(CONTRACTOR_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapContractorError(err);
  }
}

export async function updateContractor(payload: ContractorPayload): Promise<void> {
  if (!payload.title.trim()) {
    throw new ContractorError('missing-fields');
  }

  try {
    await httpClient.post(CONTRACTOR_ENDPOINTS.update, payload);
  } catch (err) {
    throw mapContractorError(err);
  }
}

export async function deleteContractor(id: string): Promise<void> {
  try {
    await httpClient.post(CONTRACTOR_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapContractorError(err);
  }
}
