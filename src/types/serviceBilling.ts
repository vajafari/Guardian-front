/** FinDocumentStatusEnumeration. */
export type ServiceBillingStatus = 1 | 2 | 3;

export interface ServiceBilling {
  id: string;
  accountingEntityId: string;
  fiscalYearId: string;
  documentNumber: string;
  documentDate: string;
  status: ServiceBillingStatus;
  description: string | null;
  journalEntryId: string | null;
  reversalJournalEntryId: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  serviceBillingTypeId: string;
  partyId: string;
  buildingUnitId: string | null;
  buildingSpaceId: string | null;
  buildingId: string;
  title: string;
  amount: number;
  dueDate: string;
  fundId: string;
  costCategoryId: string | null;
}

/** Row shape from GET /api/fin/ServiceBilling/GetById/{id}. */
export interface ServiceBillingFullInfo extends ServiceBilling {
  accountingEntityTitle: string;
  fiscalYearTitle: string;
  journalEntryNumber: number | null;
  reversalJournalEntryNumber: number | null;
  partyDisplayName: string;
  serviceBillingTypeTitle: string;
  buildingUnitTitle: string | null;
  buildingSpaceTitle: string | null;
  buildingTitle: string;
  fundTitle: string;
  costCategoryTitle: string | null;
  settledAmount: number;
  openAmount: number;
}

export interface ServiceBillingRequestPayload {
  accountingEntityId: string;
  documentDate: string;
  serviceBillingTypeId: string;
  partyId: string;
  amount: number;
  buildingUnitId: string | null;
  buildingSpaceId: string | null;
  title: string | null;
  dueDate: string | null;
  fundId: string | null;
  costCategoryId: string | null;
  description: string | null;
}

export type ServiceBillingErrorCode =
  | 'missing-fields'
  | 'document-date-invalid'
  | 'type-not-found'
  | 'type-inactive'
  | 'party-not-found'
  | 'party-inactive'
  | 'fund-not-found'
  | 'fund-inactive'
  | 'cost-category-not-found'
  | 'cost-category-inactive'
  | 'cost-category-not-leaf'
  | 'cancel-reason-required'
  | 'already-settled'
  | 'not-found'
  | 'network-error'
  | 'unknown';

export class ServiceBillingError extends Error {
  code: ServiceBillingErrorCode;

  constructor(code: ServiceBillingErrorCode) {
    super(code);
    this.code = code;
    this.name = 'ServiceBillingError';
  }
}
