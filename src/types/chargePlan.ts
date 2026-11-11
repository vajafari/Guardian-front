import type { LateFeeMode } from './finSetup';

export interface ChargePlan {
  id: string;
  accountingEntityId: string;
  dueDay: number;
  graceDays: number;
  lateFeeMode: LateFeeMode;
  lateFeeRate: number;
  lateFeeCapPercent: number | null;
  lateFeeFundId: string;
  rentIncomeFundId: string;
  roundingUnit: number;
  fundWarningBalance: number | null;
  autoCreateResidentUser: boolean;
  residentUserGroupId: string | null;
  description: string | null;
}

/** Row shape from GET /api/fin/ChargePlan/GetById/{id}. */
export interface ChargePlanFullInfo extends ChargePlan {
  accountingEntityTitle: string;
  lateFeeFundTitle: string;
  rentIncomeFundTitle: string;
  residentUserGroupTitle: string | null;
}

export interface ChargePlanPayload {
  id: string;
  accountingEntityId: string;
  dueDay: number;
  graceDays: number;
  lateFeeMode: LateFeeMode;
  lateFeeRate: number;
  lateFeeCapPercent: number | null;
  lateFeeFundId: string;
  rentIncomeFundId: string;
  roundingUnit: number;
  fundWarningBalance: number | null;
  autoCreateResidentUser: boolean;
  residentUserGroupId: string | null;
  description: string | null;
}

export type ChargePlanErrorCode =
  | 'missing-fields'
  | 'already-exists'
  | 'has-issues-cannot-delete'
  | 'not-found'
  | 'network-error'
  | 'unknown';

export class ChargePlanError extends Error {
  code: ChargePlanErrorCode;

  constructor(code: ChargePlanErrorCode) {
    super(code);
    this.code = code;
    this.name = 'ChargePlanError';
  }
}
