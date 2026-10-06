import type { ReactNode } from 'react';

/**
 * Mirrors Guardian.Shared.GridViewModels.MdsGridViewOperatorEnum (numeric values
 * are sent to the backend as-is — see gridViewProtocol.ts).
 */
export type GridViewOperator =
  | 'equal'
  | 'notEqual'
  | 'contain'
  | 'notContain'
  | 'like'
  | 'notLike'
  | 'startsWith'
  | 'notStartsWith'
  | 'endsWith'
  | 'notEndsWith'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual';

export type GridViewSortDirection = 'asc' | 'desc';

/** A GridView data row as returned by MdsGridViewHelper: PascalCase keys, native JSON value types. */
export type GridViewRow = Record<string, unknown>;

export interface GridViewColumn<TRow extends object = GridViewRow> {
  /** Backend property name this column reads/sorts/filters by (PascalCase, e.g. "Title"). */
  propertyName: string;
  header: string;
  sortable?: boolean;
  /** Text-filter operator; omit to make the column unfilterable. */
  filterOperator?: GridViewOperator;
  render?: (row: TRow) => ReactNode;
  className?: string;
}

export interface GridViewResponse<TRow extends object = GridViewRow> {
  rows: TRow[];
  totalRows: number;
  currentPage: number;
}
