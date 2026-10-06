import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiChevronUp, HiChevronDown } from 'react-icons/hi';
import { httpClient } from '../api/httpClient';
import { buildGridViewQueryParams, type GridViewFilterValue, type GridViewSortValue } from '../api/gridViewProtocol';
import type { GridViewColumn, GridViewResponse, GridViewRow, GridViewSortDirection } from '../types/gridView';
import { Alert, Button, Input, Spinner } from './ui';

export interface GridViewHandle {
  reload: () => void;
}

interface GridViewProps<TRow extends object> {
  dataUrl: string;
  columns: GridViewColumn<TRow>[];
  rowKey: (row: TRow) => string;
  itemsPerPage?: number;
  actions?: (row: TRow) => React.ReactNode;
  onRowClick?: (row: TRow) => void;
  emptyText: string;
  ref?: React.Ref<GridViewHandle>;
}

const FILTER_DEBOUNCE_MS = 400;

export function GridView<TRow extends object = GridViewRow>({
  dataUrl,
  columns,
  rowKey,
  itemsPerPage = 15,
  actions,
  onRowClick,
  emptyText,
  ref,
}: GridViewProps<TRow>) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<GridViewSortValue | null>(null);
  const [filterDrafts, setFilterDrafts] = useState<Record<string, string>>({});
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<TRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  const load = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const filters: GridViewFilterValue[] = columns
        .filter((column) => column.filterOperator)
        .map((column) => ({
          propertyName: column.propertyName,
          operator: column.filterOperator!,
          value: appliedFilters[column.propertyName] ?? '',
        }));
      const params = buildGridViewQueryParams(filters, sort, page, itemsPerPage);
      const { data } = await httpClient.get<GridViewResponse<TRow>>(dataUrl, { params });
      setRows(data.rows);
      setTotalRows(data.totalRows);
      if (data.currentPage !== page) {
        setPage(data.currentPage);
      }
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUrl, page, sort, appliedFilters, reloadCounter]);

  useImperativeHandle(ref, () => ({ reload: () => setReloadCounter((count) => count + 1) }), []);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFilterChange = (propertyName: string, value: string) => {
    setFilterDrafts((drafts) => ({ ...drafts, [propertyName]: value }));
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setPage(1);
      setAppliedFilters((filters) => ({ ...filters, [propertyName]: value }));
    }, FILTER_DEBOUNCE_MS);
  };

  const toggleSort = (column: GridViewColumn<TRow>) => {
    if (!column.sortable) return;
    setSort((current) => {
      if (!current || current.propertyName !== column.propertyName) {
        return { propertyName: column.propertyName, direction: 'asc' };
      }
      const nextDirection: GridViewSortDirection = current.direction === 'asc' ? 'desc' : 'asc';
      return { propertyName: column.propertyName, direction: nextDirection };
    });
    setPage(1);
  };

  const hasFilters = columns.some((column) => column.filterOperator);
  const totalPages = Math.max(1, Math.ceil(totalRows / itemsPerPage));

  return (
    <div>
      {hasError ? (
        <Alert type="danger" className="mb-2">
          <div className="flex items-center justify-between gap-4">
            <span>{t('gridView.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('gridView.retry')}
            </Button>
          </div>
        </Alert>
      ) : (
        <div className="overflow-x-auto relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center z-10">
              <Spinner size={28} />
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                {columns.map((column) => (
                  <th
                    key={column.propertyName}
                    className={`py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400 ${column.className ?? ''} ${column.sortable ? 'cursor-pointer select-none' : ''}`}
                    onClick={() => toggleSort(column)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {column.header}
                      {column.sortable && sort?.propertyName === column.propertyName && (
                        sort.direction === 'asc' ? <HiChevronUp /> : <HiChevronDown />
                      )}
                    </span>
                  </th>
                ))}
                {actions && <th className="py-2 px-3 text-end font-semibold text-gray-500 dark:text-gray-400" />}
              </tr>
              {hasFilters && (
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {columns.map((column) => (
                    <th key={column.propertyName} className="py-1.5 px-3">
                      {column.filterOperator && (
                        <Input
                          size="sm"
                          value={filterDrafts[column.propertyName] ?? ''}
                          onChange={(event) => handleFilterChange(column.propertyName, event.target.value)}
                        />
                      )}
                    </th>
                  ))}
                  {actions && <th />}
                </tr>
              )}
            </thead>
            <tbody>
              {rows.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="py-6 text-center text-gray-500 dark:text-gray-400">
                    {emptyText}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={() => onRowClick?.(row)}
                    className={`border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40 ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {columns.map((column) => (
                      <td key={column.propertyName} className={`py-2 px-3 ${column.className ?? ''}`}>
                        {column.render
                          ? column.render(row)
                          : String((row as GridViewRow)[column.propertyName] ?? '—')}
                      </td>
                    ))}
                    {actions && (
                      <td className="py-2 px-3 text-end" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">{actions(row)}</div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!hasError && totalRows > 0 && (
        <div className="flex items-center justify-between mt-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{t('gridView.totalRows', { count: totalRows })}</span>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="plain"
              icon={<HiOutlineChevronLeft />}
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            />
            <span>{t('gridView.pageOf', { page, totalPages })}</span>
            <Button
              size="xs"
              variant="plain"
              icon={<HiOutlineChevronRight />}
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
