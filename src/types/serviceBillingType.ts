export interface ServiceBillingType {
  id: string;
  accountingEntityId: string;
  title: string;
  defaultAmount: number | null;
  fundId: string;
  costCategoryId: string | null;
  isActive: boolean;
  description: string | null;
}

export interface ServiceBillingTypePayload {
  id: string;
  accountingEntityId: string;
  title: string;
  defaultAmount: number | null;
  fundId: string;
  costCategoryId: string | null;
  isActive: boolean;
  description: string | null;
}

export type ServiceBillingTypeErrorCode =
  | 'missing-fields'
  | 'title-must-be-unique'
  | 'cost-category-not-leaf'
  | 'not-found'
  | 'network-error'
  | 'unknown';

export class ServiceBillingTypeError extends Error {
  code: ServiceBillingTypeErrorCode;

  constructor(code: ServiceBillingTypeErrorCode) {
    super(code);
    this.code = code;
    this.name = 'ServiceBillingTypeError';
  }
}
