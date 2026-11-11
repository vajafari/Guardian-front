import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { PARTY_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { PartyError, type Party, type PartyFullInfo, type PartyPayload } from '../types/party';

const FIN_STATUS_PARTY_NOT_FOUND = 37400;
const FIN_STATUS_PARTY_PERSON_ALREADY_HAS_PARTY = 37404;
const FIN_STATUS_PARTY_IS_NOT_ACTIVE = 37409;

function mapPartyError(err: unknown): PartyError {
  if (!(err instanceof AxiosError)) {
    return new PartyError('unknown');
  }
  if (!err.response) {
    return new PartyError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_PARTY_PERSON_ALREADY_HAS_PARTY)) {
    return new PartyError('person-already-has-party');
  }
  if (errorCodes.includes(FIN_STATUS_PARTY_IS_NOT_ACTIVE)) {
    return new PartyError('not-active');
  }
  if (errorCodes.includes(FIN_STATUS_PARTY_NOT_FOUND)) {
    return new PartyError('not-found');
  }
  return new PartyError('missing-fields');
}

export async function searchActiveParties(): Promise<PartyFullInfo[]> {
  const { data } = await httpClient.post<PartyFullInfo[]>(PARTY_ENDPOINTS.searchFullInfo, {
    filter: { isActive: true },
  });
  return data;
}

export async function searchPartiesByPerson(personId: string): Promise<PartyFullInfo[]> {
  const { data } = await httpClient.post<PartyFullInfo[]>(PARTY_ENDPOINTS.searchFullInfo, {
    filter: { personIds: [personId] },
  });
  return data;
}

export async function addPartyForPerson(personId: string): Promise<Party> {
  const payload: PartyPayload = {
    id: crypto.randomUUID(),
    partyType: 1,
    personId,
    contractorId: null,
    title: null,
    nationalCode: null,
    economicCode: null,
    mobileNumber: null,
    isActive: true,
    description: null,
  };
  try {
    const { data } = await httpClient.post<Party>(PARTY_ENDPOINTS.add, payload);
    return data;
  } catch (err) {
    throw mapPartyError(err);
  }
}
