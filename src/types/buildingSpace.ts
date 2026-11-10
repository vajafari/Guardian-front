/** BuildingSpaceTypeEnumeration — display/list grouping only; rules hang on SpaceNature. */
export type SpaceType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 99;

/** BuildingSpaceNatureEnumeration — the axis the business rules are built on. */
export type SpaceNature = 1 | 2;

/** Row shape from POST /api/core/BuildingSpace/Search and the GridView rows (mapped). */
export interface BuildingSpace {
  id: string;
  buildingId: string;
  buildingFloorId: string | null;
  ownerBuildingUnitId: string | null;
  spaceType: SpaceType;
  spaceNature: SpaceNature;
  spaceNumber: string;
  title: string;
  area: number | null;
  capacity: number | null;
  isChargeable: boolean;
  isReservable: boolean;
  locationId: string | null;
  isActive: boolean;
  description: string | null;
}

/** GridViewData row, with joined display titles. */
export interface BuildingSpaceFullInfo extends BuildingSpace {
  buildingTitle: string;
  buildingNumber: number;
  buildingFloorTitle: string | null;
  ownerBuildingUnitTitle: string | null;
  locationTitle: string | null;
}

/** POST /api/core/BuildingSpace/Add and /Update body. */
export interface BuildingSpacePayload {
  id: string;
  buildingId: string;
  buildingFloorId: string | null;
  ownerBuildingUnitId: string | null;
  spaceType: SpaceType;
  spaceNature: SpaceNature;
  spaceNumber: string;
  title: string;
  area: number | null;
  capacity: number | null;
  isChargeable: boolean;
  isReservable: boolean;
  locationId: string | null;
  isActive: boolean;
  description: string | null;
  settingsInJson: string | null;
}

/** POST /api/core/BuildingSpace/Search body (also used for pickers elsewhere, e.g. Contract's target). */
export interface BuildingSpaceSearchFilter {
  buildingIds?: string[];
  buildingFloorIds?: string[];
  spaceNatures?: SpaceNature[];
  isActive?: boolean;
}

export type BuildingSpaceErrorCode =
  | 'missing-fields'
  | 'title-invalid'
  | 'number-invalid'
  | 'not-found'
  | 'building-required'
  | 'type-invalid'
  | 'nature-invalid'
  | 'number-already-exists'
  | 'floor-not-in-building'
  | 'owner-unit-not-in-building'
  | 'owner-unit-only-for-exclusive'
  | 'chargeable-only-for-exclusive'
  | 'reservable-only-for-shared'
  | 'area-invalid'
  | 'capacity-invalid'
  | 'network-error'
  | 'unknown';

export class BuildingSpaceError extends Error {
  code: BuildingSpaceErrorCode;

  constructor(code: BuildingSpaceErrorCode) {
    super(code);
    this.code = code;
    this.name = 'BuildingSpaceError';
  }
}
