/** Nested inside GET /api/core/Contractor/GetById/{id}'s contractsFullInfo. */
export interface ContractorContract {
  id: string;
  contractorId: string;
  title: string;
  contractNumber: string;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  isActive: boolean;
}

/** POST /api/core/ContractorContract/Add and /Update body. */
export interface ContractorContractPayload {
  id: string;
  contractorId: string;
  title: string;
  contractNumber: string;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  isActive: boolean;
}

export type ContractorContractErrorCode = 'missing-fields' | 'network-error' | 'unknown';

export class ContractorContractError extends Error {
  code: ContractorContractErrorCode;

  constructor(code: ContractorContractErrorCode) {
    super(code);
    this.code = code;
    this.name = 'ContractorContractError';
  }
}
