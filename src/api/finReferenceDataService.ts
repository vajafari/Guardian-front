import { httpClient } from './httpClient';
import { FIN_REFERENCE_DATA_ENDPOINTS } from './config';
import type { FinAccountingEntity, FinFiscalPeriod, FinFiscalYear } from '../types/finReferenceData';

export async function searchAccountingEntities(): Promise<FinAccountingEntity[]> {
  const { data } = await httpClient.post<FinAccountingEntity[]>(FIN_REFERENCE_DATA_ENDPOINTS.searchAccountingEntities, {
    filter: {},
  });
  return data;
}

export async function searchFiscalYears(accountingEntityId: string): Promise<FinFiscalYear[]> {
  const { data } = await httpClient.post<FinFiscalYear[]>(FIN_REFERENCE_DATA_ENDPOINTS.searchFiscalYears, {
    filter: { accountingEntityIds: [accountingEntityId] },
  });
  return data;
}

export async function searchFiscalPeriods(fiscalYearId: string): Promise<FinFiscalPeriod[]> {
  const { data } = await httpClient.post<FinFiscalPeriod[]>(FIN_REFERENCE_DATA_ENDPOINTS.searchFiscalPeriods, {
    filter: { fiscalYearIds: [fiscalYearId] },
  });
  return data;
}
