import { httpClient } from './httpClient';
import { RECEIVABLE_ENDPOINTS } from './config';

/** ReceivableKindEnumeration: 1 Charge, 2 Rent, 3 LateFee, 4 ServiceBilling, 5 Opening, 6 Overpayment. */
export type ReceivableKind = 1 | 2 | 3 | 4 | 5 | 6;

export interface ReceivableSummary {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  openAmount: number;
  receivableKind: ReceivableKind;
}

/** Charge=1, Rent=2, LateFee=3, ServiceBilling=4, Opening=5 — excludes Overpayment(6), which is a credit, not something a receipt can be allocated against. */
const ALLOCATABLE_RECEIVABLE_KINDS: ReceivableKind[] = [1, 2, 3, 4, 5];

export async function searchOpenReceivablesByParty(accountingEntityId: string, partyId: string): Promise<ReceivableSummary[]> {
  const { data } = await httpClient.post<ReceivableSummary[]>(RECEIVABLE_ENDPOINTS.searchFullInfo, {
    filter: {
      accountingEntityIds: [accountingEntityId],
      partyIds: [partyId],
      // `onlyOpen` alone does not filter by Status — a cancelled receivable with no settlements would
      // still show a nonzero OpenAmount, so Active must be passed explicitly (matches how the backend's
      // own ReceivableBuildAllocationsAsync combines these two filters internally).
      statuses: [1],
      onlyOpen: true,
      receivableKinds: ALLOCATABLE_RECEIVABLE_KINDS,
    },
  });
  return data;
}
