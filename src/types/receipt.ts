/** FinDocumentStatusEnumeration. */
export type ReceiptStatus = 1 | 2 | 3;

/** ReceiptPaymentMethodEnumeration — only the CashAccount-based methods are supported in this pass. */
export type ReceiptPaymentMethod = 1 | 2 | 3; // 1 = Cash, 2 = Card, 3 = Transfer

export interface ReceiptAllocationFullInfo {
  id: string;
  receivableId: string;
  receivableTitle: string;
  receivableDueDate: string;
  amount: number;
}

/** Row shape from GET /api/fin/Receipt/GetById/{id}. */
export interface ReceiptFullInfo {
  id: string;
  accountingEntityId: string;
  accountingEntityTitle: string;
  documentNumber: string;
  documentDate: string;
  status: ReceiptStatus;
  partyId: string | null;
  partyDisplayName: string | null;
  paymentMethod: ReceiptPaymentMethod | null;
  cashAccountId: string | null;
  cashAccountTitle: string | null;
  amount: number;
  description: string | null;
  allocatedAmount: number;
  overpaymentAmount: number;
  cancelReason: string | null;
  allocationsFullInfo: ReceiptAllocationFullInfo[];
}

export interface ReceiptAllocationPayload {
  receivableId: string;
  amount: number;
}

export interface ReceiptRequestPayload {
  accountingEntityId: string;
  documentDate: string;
  partyId: string;
  paymentMethod: ReceiptPaymentMethod;
  cashAccountId: string;
  amount: number;
  description: string | null;
  allocations: ReceiptAllocationPayload[];
  autoAllocate: boolean;
  overpaymentBuildingUnitId: string | null;
  overpaymentBuildingSpaceId: string | null;
}

export type ReceiptErrorCode =
  | 'missing-fields'
  | 'allocation-invalid'
  | 'overpayment-target-required'
  | 'cancel-reason-required'
  | 'credit-in-use'
  | 'not-found'
  | 'network-error'
  | 'unknown';

export class ReceiptError extends Error {
  code: ReceiptErrorCode;

  constructor(code: ReceiptErrorCode) {
    super(code);
    this.code = code;
    this.name = 'ReceiptError';
  }
}
