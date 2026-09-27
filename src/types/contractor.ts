import type { ContractorContract } from './contractorContract';

/** ContactorTypeEnumeration — only one value exists so far, pending a real business decision. */
export type ContactorType = 1;

/** Row shape from GET /api/core/Contractor/GridViewData (list). */
export interface Contractor {
  id: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  contactorType: ContactorType;
  subjectOfActivity: string | null;
  phoneNumber: string | null;
  address: string | null;
  description: string | null;
  economicCode: string | null;
}

/** GET /api/core/Contractor/GetById/{id} response — also carries its contracts. */
export interface ContractorFullInfo extends Contractor {
  contractsFullInfo: ContractorContract[];
}

/** POST /api/core/Contractor/Add and /Update body. */
export interface ContractorPayload {
  id: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  contactorType: ContactorType;
  subjectOfActivity: string | null;
  phoneNumber: string | null;
  address: string | null;
  description: string | null;
  economicCode: string | null;
  contracts: [];
}

export type ContractorErrorCode = 'missing-fields' | 'network-error' | 'unknown';

export class ContractorError extends Error {
  code: ContractorErrorCode;

  constructor(code: ContractorErrorCode) {
    super(code);
    this.code = code;
    this.name = 'ContractorError';
  }
}
