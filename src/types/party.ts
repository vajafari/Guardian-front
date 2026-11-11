export type PartyType = 1 | 2; // 1 = Natural, 2 = Legal

export interface Party {
  id: string;
  partyType: PartyType;
  personId: string | null;
  contractorId: string | null;
  title: string | null;
  nationalCode: string | null;
  economicCode: string | null;
  mobileNumber: string | null;
  isActive: boolean;
  description: string | null;
}

export interface PartyFullInfo extends Party {
  displayName: string;
  personFullName: string | null;
  personNationalId: string | null;
  contractorTitle: string | null;
  isUsed: boolean;
}

export interface PartyPayload {
  id: string;
  partyType: PartyType;
  personId: string | null;
  contractorId: string | null;
  title: string | null;
  nationalCode: string | null;
  economicCode: string | null;
  mobileNumber: string | null;
  isActive: boolean;
  description: string | null;
}

export type PartyErrorCode = 'missing-fields' | 'person-already-has-party' | 'not-found' | 'not-active' | 'network-error' | 'unknown';

export class PartyError extends Error {
  code: PartyErrorCode;

  constructor(code: PartyErrorCode) {
    super(code);
    this.code = code;
    this.name = 'PartyError';
  }
}
