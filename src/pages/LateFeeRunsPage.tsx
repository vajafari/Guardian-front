import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBan, HiOutlinePlus } from 'react-icons/hi';
import type { LateFeeRunGridRow } from '../api/lateFeeRunService';
import { LATE_FEE_RUN_ENDPOINTS } from '../api/config';
import { Button, Card } from '../components/ui';
import { LateFeeRunFormDialog } from '../components/LateFeeRunFormDialog';
import { LateFeeRunCancelDialog } from '../components/LateFeeRunCancelDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function LateFeeRunsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('lateFeeRuns.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={() => setIsFormOpen(true)}>
          {t('lateFeeRuns.addButton')}
        </Button>
      </div>

      <GridView<LateFeeRunGridRow>
        ref={gridRef}
        dataUrl={LATE_FEE_RUN_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('lateFeeRuns.empty')}
        onRowClick={(row) => navigate(`/fin/late-fee-runs/${row.Id}`)}
        columns={[
          {
            propertyName: 'DocumentNumber',
            header: t('lateFeeRuns.fields.documentNumber'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'AccountingEntityTitle',
            header: t('lateFeeRuns.fields.accountingEntity'),
            filterOperator: 'like',
          },
          {
            propertyName: 'DocumentDate',
            header: t('lateFeeRuns.fields.documentDate'),
            sortable: true,
          },
          {
            propertyName: 'FeeCount',
            header: t('lateFeeRuns.fields.feeCount'),
            sortable: true,
          },
          {
            propertyName: 'TotalAmount',
            header: t('lateFeeRuns.fields.totalAmount'),
            sortable: true,
            render: (row) => row.TotalAmount.toLocaleString(),
          },
          {
            propertyName: 'Status',
            header: t('lateFeeRuns.fields.status'),
            render: (row) => t(`lateFeeRuns.statuses.${row.Status}`),
          },
        ]}
        actions={(row) =>
          row.Status === 2 ? (
            <Button variant="plain" size="xs" icon={<HiOutlineBan />} onClick={() => setCancellingId(row.Id)} />
          ) : null
        }
      />

      <LateFeeRunFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onIssued={() => gridRef.current?.reload()} />

      <LateFeeRunCancelDialog
        isOpen={!!cancellingId}
        lateFeeRunId={cancellingId}
        onClose={() => setCancellingId(null)}
        onCancelled={() => gridRef.current?.reload()}
      />
    </Card>
  );
}
