import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { CASH_ACCOUNT_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { CashAccountError, type CashAccount, type CashAccountPayload, type CashAccountType } from '../types/cashAccount';

const FIN_STATUS_CASH_ACCOUNT_NOT_FOUND = 37300;
const FIN_STATUS_CASH_ACCOUNT_TITLE_IS_NOT_VALID = 37301;
const FIN_STATUS_CASH_ACCOUNT_TYPE_IS_NOT_VALID = 37302;
const FIN_STATUS_CASH_ACCOUNT_SHEBA_IS_NOT_VALID = 37303;
const FIN_STATUS_CASH_ACCOUNT_CARD_NUMBER_IS_NOT_VALID = 37304;
const FIN_STATUS_CASH_ACCOUNT_CUSTODIAN_NOT_FOUND = 37305;
const FIN_STATUS_CASH_ACCOUNT_BANK_FIELDS_ARE_ONLY_ALLOWED_FOR_BANK_ACCOUNT = 37306;
const FIN_STATUS_CASH_ACCOUNT_TYPE_CAN_NOT_BE_CHANGED = 37308;
const FIN_STATUS_RECORD_IS_IN_USE_AND_CAN_NOT_BE_DELETED = 37004;

/** GridView row — PascalCase, same convention as every other GridView row. */
export interface CashAccountGridRow {
  Id: string;
  AccountingEntityId: string;
  CashAccountType: CashAccountType;
  Title: string;
  AccountNumber: string;
  CustodianPartyId: string;
  CustodianPartyDisplayName: string;
  IsActive: boolean;
  IsUsedInJournal: boolean;
}

function mapCashAccountError(err: unknown): CashAccountError {
  if (!(err instanceof AxiosError)) {
    return new CashAccountError('unknown');
  }
  if (!err.response) {
    return new CashAccountError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_RECORD_IS_IN_USE_AND_CAN_NOT_BE_DELETED)) {
    return new CashAccountError('in-use');
  }
  if (errorCodes.includes(FIN_STATUS_CASH_ACCOUNT_TYPE_CAN_NOT_BE_CHANGED)) {
    return new CashAccountError('type-can-not-be-changed');
  }
  if (errorCodes.includes(FIN_STATUS_CASH_ACCOUNT_BANK_FIELDS_ARE_ONLY_ALLOWED_FOR_BANK_ACCOUNT)) {
    return new CashAccountError('bank-fields-not-allowed');
  }
  if (errorCodes.includes(FIN_STATUS_CASH_ACCOUNT_CUSTODIAN_NOT_FOUND)) {
    return new CashAccountError('custodian-not-found');
  }
  if (errorCodes.includes(FIN_STATUS_CASH_ACCOUNT_CARD_NUMBER_IS_NOT_VALID)) {
    return new CashAccountError('card-number-invalid');
  }
  if (errorCodes.includes(FIN_STATUS_CASH_ACCOUNT_SHEBA_IS_NOT_VALID)) {
    return new CashAccountError('sheba-invalid');
  }
  if (
    errorCodes.includes(FIN_STATUS_CASH_ACCOUNT_TITLE_IS_NOT_VALID) ||
    errorCodes.includes(FIN_STATUS_CASH_ACCOUNT_TYPE_IS_NOT_VALID)
  ) {
    return new CashAccountError('missing-fields');
  }
  if (errorCodes.includes(FIN_STATUS_CASH_ACCOUNT_NOT_FOUND)) {
    return new CashAccountError('not-found');
  }
  return new CashAccountError('unknown');
}

export async function searchCashAccountsByEntity(accountingEntityId: string): Promise<CashAccount[]> {
  const { data } = await httpClient.post<CashAccount[]>(CASH_ACCOUNT_ENDPOINTS.search, {
    filter: { accountingEntityIds: [accountingEntityId], isActive: true },
  });
  return data;
}

export async function saveCashAccount(payload: CashAccountPayload, isEdit: boolean): Promise<void> {
  if (!payload.accountingEntityId || !payload.title.trim() || !payload.cashAccountType) {
    throw new CashAccountError('missing-fields');
  }

  try {
    await httpClient.post(isEdit ? CASH_ACCOUNT_ENDPOINTS.update : CASH_ACCOUNT_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapCashAccountError(err);
  }
}

export async function deleteCashAccount(id: string): Promise<void> {
  try {
    await httpClient.post(CASH_ACCOUNT_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapCashAccountError(err);
  }
}
