export interface ChargeDiscount {
  id: string;
  chargePlanId: string;
  buildingUnitId: string | null;
  buildingSpaceId: string | null;
  coefficient: number;
  validFrom: string;
  validTo: string | null;
  reason: string;
}

export interface ChargeDiscountPayload {
  id: string;
  chargePlanId: string;
  buildingUnitId: string | null;
  buildingSpaceId: string | null;
  coefficient: number;
  validFrom: string;
  validTo: string | null;
  reason: string;
}

export type ChargeDiscountErrorCode =
  | 'missing-fields'
  | 'overlaps-another-discount'
  | 'not-found'
  | 'network-error'
  | 'unknown';

export class ChargeDiscountError extends Error {
  code: ChargeDiscountErrorCode;

  constructor(code: ChargeDiscountErrorCode) {
    super(code);
    this.code = code;
    this.name = 'ChargeDiscountError';
  }
}
