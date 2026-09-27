/** UnitTypeEnumeration — "ماهیت واحد". */
export type UnitType = 1 | 2 | 3 | 4 | 5;

/** Nested inside GET /api/core/BuildingFloor/GetById/{id}'s unitsFullInfo. */
export interface BuildingUnit {
  id: string;
  buildingFloorId: string;
  title: number;
  description: string | null;
  telephoneNumbers: string | null;
  postalCode: string | null;
  isEmpty: boolean;
  unitType: UnitType;
  buildingArea: number;
  residancePersons: number;
}

/** POST /api/core/BuildingUnit/Add and /Update body. */
export interface BuildingUnitPayload {
  id: string;
  buildingFloorId: string;
  title: number;
  description: string | null;
  telephoneNumbers: string | null;
  postalCode: string | null;
  isEmpty: boolean;
  unitType: UnitType;
  buildingArea: number;
  residancePersons: number;
}

export type BuildingUnitErrorCode = 'missing-fields' | 'network-error' | 'unknown';

export class BuildingUnitError extends Error {
  code: BuildingUnitErrorCode;

  constructor(code: BuildingUnitErrorCode) {
    super(code);
    this.code = code;
    this.name = 'BuildingUnitError';
  }
}
