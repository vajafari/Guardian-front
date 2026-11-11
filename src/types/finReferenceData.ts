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

export interface FinFund {
  id: string;
  code: number;
  title: string;
  isActive: boolean;
}

export interface FinCostCategory {
  id: string;
  parentCostCategoryId: string | null;
  title: string;
  isActive: boolean;
}

export interface FinAccountingEntityBuilding {
  buildingId: string;
  buildingTitle: string;
}
