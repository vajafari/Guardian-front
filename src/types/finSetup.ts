/** LateFeeModeEnumeration. */
export type LateFeeMode = 0 | 1 | 2;

/** POST /api/fin/FinSetup/QuickSetup body. Components is intentionally always omitted — the backend builds default charge components from MonthlyChargeAmount/MonthlyReserveAmount when it's empty. */
export interface FinQuickSetupPayload {
  title: string;
  buildingIds: string[];
  fiscalYearTitle: string;
  fiscalYearStartDate: string;
  fiscalYearEndDate: string;
  bankAccountTitle: string;
  bankName: string | null;
  accountNumber: string | null;
  sheba: string | null;
  dueDay: number;
  graceDays: number;
  lateFeeMode: LateFeeMode;
  lateFeeRate: number;
  monthlyChargeAmount: number;
  monthlyReserveAmount: number;
}

export interface FinQuickSetupResult {
  accountingEntityId: string;
  fiscalYearId: string;
  cashAccountId: string;
  chargePlanId: string;
  chargeComponentIds: string[];
  serviceBillingTypeIds: string[];
}

export type FinSetupErrorCode =
  | 'missing-fields'
  | 'building-already-has-accounting-entity'
  | 'partially-created'
  | 'network-error'
  | 'unknown';

export class FinSetupError extends Error {
  code: FinSetupErrorCode;

  constructor(code: FinSetupErrorCode) {
    super(code);
    this.code = code;
    this.name = 'FinSetupError';
  }
}
