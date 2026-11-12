import type { BuildingDepositMovementFullInfo } from './buildingDepositMovement';

/** BuildingDepositKindEnumeration. 1 Renovation, 2 Moving, 3 SpaceTenant, 9 Other. */
export type BuildingDepositKind = 1 | 2 | 3 | 9;

/** Row shape from GET /api/fin/BuildingDeposit/GetById/{id}. */
export interface BuildingDepositFullInfo {
  id: string;
  accountingEntityId: string;
  accountingEntityTitle: string;
  partyId: string;
  partyDisplayName: string;
  buildingUnitId: string | null;
  buildingUnitTitle: string | null;
  buildingSpaceId: string | null;
  buildingSpaceTitle: string | null;
  depositKind: BuildingDepositKind;
  title: string;
  description: string | null;
  heldAmount: number;
  movementsFullInfo: BuildingDepositMovementFullInfo[];
}

export interface BuildingDepositPayload {
  id?: string;
  accountingEntityId: string;
  partyId: string;
  buildingUnitId: string | null;
  buildingSpaceId: string | null;
  depositKind: BuildingDepositKind;
  title: string;
  description: string | null;
}

export type BuildingDepositErrorCode =
  | 'missing-fields'
  | 'not-found'
  | 'has-movements-can-not-delete'
  | 'can-not-change-after-movements'
  | 'network-error'
  | 'unknown';

export class BuildingDepositError extends Error {
  code: BuildingDepositErrorCode;

  constructor(code: BuildingDepositErrorCode) {
    super(code);
    this.code = code;
    this.name = 'BuildingDepositError';
  }
}
