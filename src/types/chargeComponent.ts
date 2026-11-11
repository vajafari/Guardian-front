import type { SpaceType } from './buildingSpace';

/** ChargeTargetKindEnumeration. */
export type ChargeTargetKind = 1 | 2;

/** ChargeModelKindEnumeration. */
export type ChargeModelKind = 1 | 2;

/** ChargeSplitMethodEnumeration. */
export type ChargeSplitMethod = 1 | 2 | 3 | 4 | 5 | 6;

/** ChargePayerKindEnumeration. */
export type ChargePayerKind = 1 | 2;

export interface ChargeComponent {
  id: string;
  chargePlanId: string;
  title: string;
  targetKind: ChargeTargetKind;
  spaceType: SpaceType | null;
  buildingId: string | null;
  modelKind: ChargeModelKind;
  amount: number | null;
  splitMethod: ChargeSplitMethod;
  payerKind: ChargePayerKind;
  costCategoryId: string;
  fundId: string;
  validFrom: string;
  validTo: string | null;
  sortOrder: number;
  isActive: boolean;
  description: string | null;
}

/** Row shape from POST /api/fin/ChargeComponent/Search (plain, camelCase — not a GridView row). */
export interface ChargeComponentFullInfo extends ChargeComponent {
  accountingEntityId: string;
  costCategoryTitle: string;
  fundTitle: string;
  buildingTitle: string | null;
}

export interface ChargeComponentPayload {
  id: string;
  chargePlanId: string;
  title: string;
  targetKind: ChargeTargetKind;
  spaceType: SpaceType | null;
  buildingId: string | null;
  modelKind: ChargeModelKind;
  amount: number | null;
  splitMethod: ChargeSplitMethod;
  payerKind: ChargePayerKind;
  costCategoryId: string;
  fundId: string;
  validFrom: string;
  validTo: string | null;
  sortOrder: number;
  isActive: boolean;
  description: string | null;
}

export type ChargeComponentErrorCode =
  | 'missing-fields'
  | 'building-mismatch'
  | 'cost-category-not-leaf'
  | 'is-used-cannot-delete'
  | 'not-found'
  | 'network-error'
  | 'unknown';

export class ChargeComponentError extends Error {
  code: ChargeComponentErrorCode;

  constructor(code: ChargeComponentErrorCode) {
    super(code);
    this.code = code;
    this.name = 'ChargeComponentError';
  }
}
