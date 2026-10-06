import type { GridViewOperator, GridViewSortDirection } from '../types/gridView';

/**
 * Wire-format encoders for Guardian's GridView query protocol
 * (Guardian.Shared.Helpers.MdsGridViewHelper / MdsGridViewConditions on the backend).
 *
 * Condition string grammar: each AND-group is prefixed with "α" and contains one
 * "PropertyName=value¤operatorNumber" clause (OR-groups within an AND-group would be
 * joined with "β", but this client only ever emits one clause per column).
 * Sort string grammar: "PropertyName¤directionNumber" (1=asc, 2=desc).
 */

const OPERATOR_CODES: Record<GridViewOperator, number> = {
  equal: 1,
  notEqual: 2,
  contain: 3,
  notContain: 4,
  like: 5,
  notLike: 6,
  startsWith: 7,
  notStartsWith: 8,
  endsWith: 9,
  notEndsWith: 10,
  greaterThan: 11,
  greaterThanOrEqual: 12,
  lessThan: 13,
  lessThanOrEqual: 14,
};

const SORT_DIRECTION_CODES: Record<GridViewSortDirection, number> = {
  asc: 1,
  desc: 2,
};

export interface GridViewFilterValue {
  propertyName: string;
  operator: GridViewOperator;
  value: string;
}

export interface GridViewSortValue {
  propertyName: string;
  direction: GridViewSortDirection;
}

export function buildConditionString(filters: GridViewFilterValue[]): string {
  return filters
    .filter((filter) => filter.value.trim() !== '')
    .map((filter) => `α${filter.propertyName}=${filter.value}¤${OPERATOR_CODES[filter.operator]}`)
    .join('');
}

export function buildSortString(sort: GridViewSortValue | null): string {
  if (!sort) return '';
  return `${sort.propertyName}¤${SORT_DIRECTION_CODES[sort.direction]}`;
}

export interface GridViewQueryParams {
  C: string;
  S: string;
  P: number;
  I: number;
}

export function buildGridViewQueryParams(
  filters: GridViewFilterValue[],
  sort: GridViewSortValue | null,
  page: number,
  itemsPerPage: number,
): GridViewQueryParams {
  return {
    C: buildConditionString(filters),
    S: buildSortString(sort),
    P: page,
    I: itemsPerPage,
  };
}
