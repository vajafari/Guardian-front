export interface FinAccountingEntity {
  id: string;
  title: string;
}

export interface FinFiscalYear {
  id: string;
  title: string;
  accountingEntityId: string;
}

/** FiscalPeriodStatusEnumeration. */
export type FinFiscalPeriodStatus = number;

export interface FinFiscalPeriod {
  id: string;
  fiscalYearId: string;
  periodNumber: number;
  title: string;
  startDate: string;
  endDate: string;
  status: FinFiscalPeriodStatus;
}
