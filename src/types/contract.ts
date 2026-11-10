/** ContractTypeEnumeration. Purchase/KeyMoney = ownership; Rent/OwnerUse = usage. */
export type ContractType = 1 | 2 | 3 | 4;

/** ContractShareUnitEnumeration — only for ownership contracts, fixed once set. */
export type ContractShareUnit = 1 | 2;

/** ContractPersonRoleEnumeration. Ownership contracts allow only Principal/Representative. */
export type ContractPersonRole = 1 | 11 | 21 | 22 | 23;

/** ContractPaymentTypeEnumeration. */
export type ContractPaymentType = 1 | 2;

/** ContractPaymentPeriodEnumeration. */
export type ContractPaymentPeriod = 1 | 2 | 3 | 4 | 5 | 6;

export interface ContractPerson {
  id: string;
  contractId: string;
  personId: string;
  personRole: ContractPersonRole;
  shareAmount: number | null;
}

export interface ContractPersonFullInfo extends ContractPerson {
  personNumberOnDevice: number;
  firstName: string | null;
  lastName: string | null;
  nationalId: string | null;
}

export interface ContractPaymentDetail {
  id: string;
  contractId: string;
  paymentType: ContractPaymentType;
  paymentPeriod: ContractPaymentPeriod;
  paymentDayIndex: number;
  amount: number | null;
}

/** Row shape from GridView rows (mapped). */
export interface Contract {
  id: string;
  title: string;
  contractNumber: string;
  contractType: ContractType;
  buildingUnitId: string | null;
  buildingSpaceId: string | null;
  startDate: string;
  endDate: string | null;
  description: string | null;
  shareUnit: ContractShareUnit | null;
}

/** GridViewData row, with joined display titles. */
export interface ContractFullInfo extends Contract {
  buildingUnitTitle: string | null;
  buildingSpaceTitle: string | null;
  buildingId: string;
  buildingTitle: string;
  buildingNumber: number;
  contractPersonCount: number;
}

/** GET /api/core/Contract/GetById/{id} response — always includes the two nested full-info arrays. */
export interface ContractWithChildren extends Contract {
  contractPersonsFullInfo: ContractPersonFullInfo[];
  contractPaymentDetailsFullInfo: ContractPaymentDetail[];
}

/**
 * What the edit dialog is given: the grid row's joined display fields (building
 * title/number, target titles) plus the nested children from a GetById call —
 * the grid alone has no children, and GetById alone has no building join.
 */
export interface ContractEditModel extends ContractFullInfo {
  contractPersonsFullInfo: ContractPersonFullInfo[];
  contractPaymentDetailsFullInfo: ContractPaymentDetail[];
}

/** POST /api/core/Contract/AggregateSave and /AggregateUpdate body. */
export interface ContractPayload {
  id: string;
  title: string;
  contractNumber: string;
  contractType: ContractType;
  buildingUnitId: string | null;
  buildingSpaceId: string | null;
  startDate: string;
  endDate: string | null;
  description: string | null;
  shareUnit: ContractShareUnit | null;
  contractPersons: Array<{ id: string; contractId: string; personId: string; personRole: ContractPersonRole; shareAmount: number | null }>;
  contractPaymentDetails: Array<{
    id: string;
    contractId: string;
    paymentType: ContractPaymentType;
    paymentPeriod: ContractPaymentPeriod;
    paymentDayIndex: number;
    amount: number | null;
  }>;
}

export type ContractErrorCode =
  | 'missing-fields'
  | 'not-found'
  | 'title-invalid'
  | 'number-invalid'
  | 'number-already-exists'
  | 'target-invalid'
  | 'start-date-invalid'
  | 'end-date-before-start-date'
  | 'person-not-found'
  | 'person-already-exists'
  | 'person-id-invalid'
  | 'payment-detail-not-found'
  | 'payment-detail-amount-invalid'
  | 'share-unit-invalid'
  | 'share-unit-not-allowed-for-type'
  | 'share-amount-only-for-principal'
  | 'share-amount-requires-share-unit'
  | 'share-amount-invalid'
  | 'share-amount-total-exceeds-unit-total'
  | 'share-unit-cannot-change'
  | 'person-role-not-allowed-for-type'
  | 'usage-period-overlap'
  | 'type-invalid'
  | 'target-space-must-be-exclusive'
  | 'network-error'
  | 'unknown';

export class ContractError extends Error {
  code: ContractErrorCode;

  constructor(code: ContractErrorCode) {
    super(code);
    this.code = code;
    this.name = 'ContractError';
  }
}
