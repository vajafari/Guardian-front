/** FinDocumentStatusEnumeration. */
export type ChargeIssueStatus = 1 | 2 | 3;

export interface ChargeIssueComponent {
  title: string;
  effectiveAmount: number;
  factorTotal: number;
  issuedTotal: number;
}

export interface ChargeIssueItemFullInfo {
  id: string;
  buildingUnitTitle: string | null;
  buildingSpaceTitle: string | null;
}

export interface ChargeIssueLineFullInfo {
  id: string;
  chargeIssueItemId: string;
  payerDisplayName: string;
  componentTitle: string | null;
  amount: number;
}

/** Row shape from GET /api/fin/ChargeIssue/GetById/{id}. */
export interface ChargeIssueFullInfo {
  id: string;
  accountingEntityId: string;
  accountingEntityTitle: string;
  fiscalYearId: string;
  fiscalPeriodId: string;
  fiscalPeriodTitle: string;
  periodStart: string;
  periodEnd: string;
  documentNumber: string;
  documentDate: string;
  dueDate: string;
  status: ChargeIssueStatus;
  itemCount: number;
  totalAmount: number;
  activeTotalAmount: number;
  description: string | null;
  componentsFullInfo: ChargeIssueComponent[];
  itemsFullInfo: ChargeIssueItemFullInfo[];
  linesFullInfo: ChargeIssueLineFullInfo[];
}

export interface ChargeIssueRequestPayload {
  accountingEntityId: string;
  fiscalPeriodId: string;
  documentDate: string | null;
  description: string | null;
  excludeRent: boolean;
  runLateFee: boolean;
}

/** POST /api/fin/ChargeIssue/Preview response, flattened — items/lines arrays aren't readable without extra joins, so only counts+totals are kept. */
export interface ChargeIssuePreview {
  periodStart: string;
  periodEnd: string;
  documentDate: string;
  dueDate: string;
  totalAmount: number;
  components: ChargeIssueComponent[];
  receivableCount: number;
  receivableTotal: number;
  lateFeeCount: number;
  lateFeeTotal: number;
}

export type ChargeIssueErrorCode =
  | 'missing-fields'
  | 'period-not-found'
  | 'nothing-to-issue'
  | 'cannot-cancel'
  | 'cancel-reason-required'
  | 'not-found'
  | 'network-error'
  | 'unknown';

export class ChargeIssueError extends Error {
  code: ChargeIssueErrorCode;

  constructor(code: ChargeIssueErrorCode) {
    super(code);
    this.code = code;
    this.name = 'ChargeIssueError';
  }
}
