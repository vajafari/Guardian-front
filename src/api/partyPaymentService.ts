import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { PARTY_PAYMENT_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { PartyPaymentError, type PartyPaymentFullInfo, type PartyPaymentRequestPayload, type PartyPaymentStatus } from '../types/partyPayment';

const FIN_STATUS_PARTY_PAYMENT_NOT_FOUND = 37720;
const FIN_STATUS_PARTY_PAYMENT_AMOUNT_IS_NOT_VALID = 37721;
const FIN_STATUS_PARTY_PAYMENT_SETTLED_ACCOUNT_IS_NOT_VALID = 37722;
const FIN_STATUS_PARTY_PAYMENT_METHOD_IS_NOT_VALID = 37723;
const FIN_STATUS_PARTY_PAYMENT_CHEQUES_ARE_NOT_VALID = 37724;
const FIN_STATUS_PARTY_PAYMENT_SETTLEMENT_IS_NOT_VALID = 37725;
const FIN_STATUS_PARTY_PAYMENT_ENDORSED_CHEQUE_IS_NOT_VALID = 37726;
const FIN_STATUS_PARTY_PAYMENT_HAS_MOVED_CHEQUES_AND_CAN_NOT_BE_CANCELLED = 37727;
const FIN_STATUS_PARTY_PAYMENT_CREDIT_IS_USED_AND_CAN_NOT_BE_CANCELLED = 37729;
const FIN_STATUS_CHEQUE_SAYAD_ID_MUST_BE_UNIQUE = 37313;
const FIN_STATUS_DOCUMENT_DATE_IS_NOT_VALID = 37613;
const FIN_STATUS_CANCEL_REASON_IS_REQUIRED = 37612;

/** GridView row — PascalCase, same convention as every other GridView row. */
export interface PartyPaymentGridRow {
  Id: string;
  DocumentNumber: string;
  DocumentDate: string;
  PartyDisplayName: string;
  CashAccountTitle: string;
  Amount: number;
  SettledAmount: number;
  UnsettledAmount: number;
  Status: PartyPaymentStatus;
}

function mapPartyPaymentError(err: unknown): PartyPaymentError {
  if (!(err instanceof AxiosError)) {
    return new PartyPaymentError('unknown');
  }
  if (!err.response) {
    return new PartyPaymentError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(FIN_STATUS_PARTY_PAYMENT_CREDIT_IS_USED_AND_CAN_NOT_BE_CANCELLED)) {
    return new PartyPaymentError('credit-in-use');
  }
  if (errorCodes.includes(FIN_STATUS_PARTY_PAYMENT_HAS_MOVED_CHEQUES_AND_CAN_NOT_BE_CANCELLED)) {
    return new PartyPaymentError('moved-cheques-can-not-cancel');
  }
  if (errorCodes.includes(FIN_STATUS_CANCEL_REASON_IS_REQUIRED)) {
    return new PartyPaymentError('cancel-reason-required');
  }
  if (errorCodes.includes(FIN_STATUS_CHEQUE_SAYAD_ID_MUST_BE_UNIQUE)) {
    return new PartyPaymentError('sayad-not-unique');
  }
  if (errorCodes.includes(FIN_STATUS_PARTY_PAYMENT_ENDORSED_CHEQUE_IS_NOT_VALID)) {
    return new PartyPaymentError('endorsed-cheque-invalid');
  }
  if (errorCodes.includes(FIN_STATUS_PARTY_PAYMENT_SETTLEMENT_IS_NOT_VALID)) {
    return new PartyPaymentError('settlement-invalid');
  }
  if (errorCodes.includes(FIN_STATUS_PARTY_PAYMENT_SETTLED_ACCOUNT_IS_NOT_VALID)) {
    return new PartyPaymentError('settled-account-invalid');
  }
  if (
    errorCodes.includes(FIN_STATUS_PARTY_PAYMENT_AMOUNT_IS_NOT_VALID) ||
    errorCodes.includes(FIN_STATUS_PARTY_PAYMENT_METHOD_IS_NOT_VALID) ||
    errorCodes.includes(FIN_STATUS_PARTY_PAYMENT_CHEQUES_ARE_NOT_VALID) ||
    errorCodes.includes(FIN_STATUS_DOCUMENT_DATE_IS_NOT_VALID)
  ) {
    return new PartyPaymentError('missing-fields');
  }
  if (errorCodes.includes(FIN_STATUS_PARTY_PAYMENT_NOT_FOUND)) {
    return new PartyPaymentError('not-found');
  }
  return new PartyPaymentError('unknown');
}

export async function getPartyPaymentById(id: string): Promise<PartyPaymentFullInfo | null> {
  const { data } = await httpClient.get<PartyPaymentFullInfo | null>(PARTY_PAYMENT_ENDPOINTS.getById(id));
  return data ?? null;
}

function validatePayload(payload: PartyPaymentRequestPayload) {
  if (!payload.accountingEntityId || !payload.documentDate || !payload.partyId || !payload.settledAccountId || !payload.amount) {
    throw new PartyPaymentError('missing-fields');
  }
  if (payload.paymentMethod === 1 && !payload.cashAccountId) {
    throw new PartyPaymentError('missing-fields');
  }
  if (payload.paymentMethod === 2 && payload.issuedCheques.length === 0) {
    throw new PartyPaymentError('missing-fields');
  }
  if (payload.paymentMethod === 3 && payload.endorsedChequeIds.length === 0) {
    throw new PartyPaymentError('endorsed-cheque-invalid');
  }
}

export async function addPartyPayment(payload: PartyPaymentRequestPayload): Promise<PartyPaymentFullInfo> {
  validatePayload(payload);
  try {
    const { data } = await httpClient.post<PartyPaymentFullInfo>(PARTY_PAYMENT_ENDPOINTS.add, {
      ...payload,
      autoSettle: false,
    });
    return data;
  } catch (err) {
    throw mapPartyPaymentError(err);
  }
}

export async function cancelPartyPayment(id: string, cancelReason: string, reversalDate: string | null): Promise<void> {
  if (!cancelReason.trim()) {
    throw new PartyPaymentError('cancel-reason-required');
  }
  try {
    await httpClient.post(PARTY_PAYMENT_ENDPOINTS.cancel, { id, cancelReason, reversalDate });
  } catch (err) {
    throw mapPartyPaymentError(err);
  }
}
