import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBan, HiOutlinePlus } from 'react-icons/hi';
import type { ChargeIssueGridRow } from '../api/chargeIssueService';
import { CHARGE_ISSUE_ENDPOINTS } from '../api/config';
import { Button, Card } from '../components/ui';
import { ChargeIssueFormDialog } from '../components/ChargeIssueFormDialog';
import { ChargeIssueCancelDialog } from '../components/ChargeIssueCancelDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function ChargeIssuesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('chargeIssues.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={() => setIsFormOpen(true)}>
          {t('chargeIssues.addButton')}
        </Button>
      </div>

      <GridView<ChargeIssueGridRow>
        ref={gridRef}
        dataUrl={CHARGE_ISSUE_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('chargeIssues.empty')}
        onRowClick={(row) => navigate(`/fin/charge-issues/${row.Id}`)}
        columns={[
          {
            propertyName: 'DocumentNumber',
            header: t('chargeIssues.fields.documentNumber'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'FiscalPeriodTitle',
            header: t('chargeIssues.fields.fiscalPeriod'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'PeriodStart',
            header: t('chargeIssues.fields.periodStart'),
            sortable: true,
          },
          {
            propertyName: 'DocumentDate',
            header: t('chargeIssues.fields.documentDate'),
            sortable: true,
          },
          {
            propertyName: 'ActiveTotalAmount',
            header: t('chargeIssues.fields.activeTotalAmount'),
            sortable: true,
            render: (row) => row.ActiveTotalAmount.toLocaleString(),
          },
          {
            propertyName: 'Status',
            header: t('chargeIssues.fields.status'),
            render: (row) => t(`chargeIssues.statuses.${row.Status}`),
          },
        ]}
        actions={(row) =>
          row.Status === 2 ? (
            <Button variant="plain" size="xs" icon={<HiOutlineBan />} onClick={() => setCancellingId(row.Id)} />
          ) : null
        }
      />

      <ChargeIssueFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onIssued={() => gridRef.current?.reload()} />

      <ChargeIssueCancelDialog
        isOpen={!!cancellingId}
        chargeIssueId={cancellingId}
        onClose={() => setCancellingId(null)}
        onCancelled={() => gridRef.current?.reload()}
      />
    </Card>
  );
}
