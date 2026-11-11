import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { CHEQUE_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { ChequeError, type ChequeDirection, type ChequeFullInfo, type ChequePayload, type ChequeStatus } from '../types/cheque';

const FIN_STATUS_CHEQUE_NOT_FOUND = 37310;
const FIN_STATUS_CHEQUE_NUMBER_IS_NOT_VALID = 37311;
const FIN_STATUS_CHEQUE_SAYAD_ID_IS_NOT_VALID = 37312;
const FIN_STATUS_CHEQUE_SAYAD_ID_MUST_BE_UNIQUE = 37313;
const FIN_STATUS_CHEQUE_AMOUNT_IS_NOT_VALID = 37314;
const FIN_STATUS_CHEQUE_DIRECTION_IS_NOT_VALID = 37315;
const FIN_STATUS_CHEQUE_STATUS_TRANSITION_IS_NOT_ALLOWED = 37319;
const FIN_STATUS_CHEQUE_BANK_ACCOUNT_IS_REQUIRED_FOR_ISSUED_CHEQUE = 37318;
const FIN_STATUS_CHEQUE_PARTY_NOT_FOUND = 37320;
const FIN_STATUS_CHEQUE_DUE_DATE_IS_NOT_VALID = 37321;
const FIN_STATUS_CHEQUE_AMOUNT_AND_PARTY_CAN_NOT_BE_CHANGED_WHEN_USED = 37322;
const FIN_STATUS_RECORD_IS_IN_USE_AND_CAN_NOT_BE_DELETED = 37004;

/** GridView row — PascalCase, same convention as every other GridView row. */
export interface ChequeGridRow {
  Id: string;
  AccountingEntityId: string;
  ChequeDirection: ChequeDirection;
  PartyId: string;
  PartyDisplayName: string;
  ChequeNumber: string;
  BankName: string;
  CashAccountTitle: string;
  DueDate: string;
  Amount: number;
  Status: ChequeStatus;
  IsUsedInJournal: boolean;
}

export interface SearchChequesOptions {
  direction?: ChequeDirection;
  statuses?: ChequeStatus[];
}

function mapChequeError(err: unknown): ChequeError {
  if (!(err instanceof AxiosError)) {
    return new ChequeError('unknown');
  }
  if (!err.response) {
    return new ChequeError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_RECORD_IS_IN_USE_AND_CAN_NOT_BE_DELETED)) {
    return new ChequeError('in-use');
  }
  if (errorCodes.includes(FIN_STATUS_CHEQUE_AMOUNT_AND_PARTY_CAN_NOT_BE_CHANGED_WHEN_USED)) {
    return new ChequeError('locked-fields-in-use');
  }
  if (errorCodes.includes(FIN_STATUS_CHEQUE_STATUS_TRANSITION_IS_NOT_ALLOWED)) {
    return new ChequeError('cannot-change-status');
  }
  if (errorCodes.includes(FIN_STATUS_CHEQUE_BANK_ACCOUNT_IS_REQUIRED_FOR_ISSUED_CHEQUE)) {
    return new ChequeError('bank-account-required');
  }
  if (errorCodes.includes(FIN_STATUS_CHEQUE_PARTY_NOT_FOUND)) {
    return new ChequeError('party-not-found');
  }
  if (errorCodes.includes(FIN_STATUS_CHEQUE_SAYAD_ID_MUST_BE_UNIQUE)) {
    return new ChequeError('sayad-not-unique');
  }
  if (errorCodes.includes(FIN_STATUS_CHEQUE_SAYAD_ID_IS_NOT_VALID)) {
    return new ChequeError('sayad-invalid');
  }
  if (
    errorCodes.includes(FIN_STATUS_CHEQUE_NUMBER_IS_NOT_VALID) ||
    errorCodes.includes(FIN_STATUS_CHEQUE_AMOUNT_IS_NOT_VALID) ||
    errorCodes.includes(FIN_STATUS_CHEQUE_DIRECTION_IS_NOT_VALID) ||
    errorCodes.includes(FIN_STATUS_CHEQUE_DUE_DATE_IS_NOT_VALID)
  ) {
    return new ChequeError('missing-fields');
  }
  if (errorCodes.includes(FIN_STATUS_CHEQUE_NOT_FOUND)) {
    return new ChequeError('not-found');
  }
  return new ChequeError('unknown');
}

export async function searchChequesByEntity(accountingEntityId: string, options: SearchChequesOptions = {}): Promise<ChequeFullInfo[]> {
  const { data } = await httpClient.post<ChequeFullInfo[]>(CHEQUE_ENDPOINTS.searchFullInfo, {
    filter: {
      accountingEntityIds: [accountingEntityId],
      chequeDirections: options.direction ? [options.direction] : undefined,
      statuses: options.statuses,
    },
  });
  return data;
}

export async function saveCheque(payload: ChequePayload, isEdit: boolean): Promise<void> {
  if (!payload.accountingEntityId || !payload.partyId || !payload.chequeNumber.trim() || !payload.dueDate || !payload.amount) {
    throw new ChequeError('missing-fields');
  }
  if (payload.chequeDirection === 2 && !payload.cashAccountId) {
    throw new ChequeError('bank-account-required');
  }

  try {
    await httpClient.post(isEdit ? CHEQUE_ENDPOINTS.update : CHEQUE_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapChequeError(err);
  }
}

export async function deleteCheque(id: string): Promise<void> {
  try {
    await httpClient.post(CHEQUE_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapChequeError(err);
  }
}
