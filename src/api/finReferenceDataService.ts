import { httpClient } from './httpClient';
import { FIN_REFERENCE_DATA_ENDPOINTS } from './config';
import type {
  FinAccountingEntity,
  FinAccountingEntityBuilding,
  FinCostCategory,
  FinFiscalPeriod,
  FinFiscalYear,
  FinFund,
} from '../types/finReferenceData';

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

export async function searchFunds(): Promise<FinFund[]> {
  const { data } = await httpClient.post<FinFund[]>(FIN_REFERENCE_DATA_ENDPOINTS.searchFunds, { filter: {} });
  return data;
}

export async function searchCostCategories(): Promise<FinCostCategory[]> {
  const { data } = await httpClient.post<FinCostCategory[]>(FIN_REFERENCE_DATA_ENDPOINTS.searchCostCategories, { filter: {} });
  return data;
}

export async function searchAccountingEntityBuildings(accountingEntityId: string): Promise<FinAccountingEntityBuilding[]> {
  const { data } = await httpClient.post<FinAccountingEntityBuilding[]>(FIN_REFERENCE_DATA_ENDPOINTS.searchAccountingEntityBuildings, {
    filter: { accountingEntityIds: [accountingEntityId] },
  });
  return data;
}

const ACCOUNT_CODE_PAYABLE_TO_PARTIES = 2110;

/** Resolves the system "Payable to parties" (2110) account's real id — PartyPayment's SettledAccountId this pass. */
export async function getPayableToPartiesAccountId(): Promise<string> {
  const { data } = await httpClient.post<Array<{ id: string }>>(FIN_REFERENCE_DATA_ENDPOINTS.searchChartOfAccounts, {
    filter: { codes: [ACCOUNT_CODE_PAYABLE_TO_PARTIES] },
  });
  return data[0].id;
}
