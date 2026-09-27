import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { CONTRACTOR_CONTRACT_ENDPOINTS } from './config';
import { ContractorContractError, type ContractorContractPayload } from '../types/contractorContract';

function mapContractorContractError(err: unknown): ContractorContractError {
  if (!(err instanceof AxiosError)) {
    return new ContractorContractError('unknown');
  }
  if (!err.response) {
    return new ContractorContractError('network-error');
  }
  return new ContractorContractError('unknown');
}

export async function addContractorContract(payload: ContractorContractPayload): Promise<void> {
  if (!payload.title.trim() || !payload.contractNumber.trim()) {
    throw new ContractorContractError('missing-fields');
  }

  try {
    await httpClient.post(CONTRACTOR_CONTRACT_ENDPOINTS.add, payload);
  } catch (err) {
    throw mapContractorContractError(err);
  }
}

export async function updateContractorContract(payload: ContractorContractPayload): Promise<void> {
  if (!payload.title.trim() || !payload.contractNumber.trim()) {
    throw new ContractorContractError('missing-fields');
  }

  try {
    await httpClient.post(CONTRACTOR_CONTRACT_ENDPOINTS.update, payload);
  } catch (err) {
    throw mapContractorContractError(err);
  }
}

export async function deleteContractorContract(id: string): Promise<void> {
  try {
    await httpClient.post(CONTRACTOR_CONTRACT_ENDPOINTS.delete(id));
  } catch (err) {
    throw mapContractorContractError(err);
  }
}
