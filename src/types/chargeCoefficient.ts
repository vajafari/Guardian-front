import type { UnitType } from './buildingUnit';

/** ChargeCoefficientKindEnumeration. */
export type ChargeCoefficientKind = 1 | 2;

export interface ChargeCoefficient {
  id: string;
  chargeComponentId: string;
  coefficientKind: ChargeCoefficientKind;
  unitType: UnitType | null;
  floorActualNumber: number | null;
  coefficient: number;
  description: string | null;
}

export interface ChargeCoefficientPayload {
  id: string;
  chargeComponentId: string;
  coefficientKind: ChargeCoefficientKind;
  unitType: UnitType | null;
  floorActualNumber: number | null;
  coefficient: number;
  description: string | null;
}

export type ChargeCoefficientErrorCode = 'missing-fields' | 'not-found' | 'network-error' | 'unknown';

export class ChargeCoefficientError extends Error {
  code: ChargeCoefficientErrorCode;

  constructor(code: ChargeCoefficientErrorCode) {
    super(code);
    this.code = code;
    this.name = 'ChargeCoefficientError';
  }
}
