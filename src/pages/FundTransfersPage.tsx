import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBan, HiOutlinePlus } from 'react-icons/hi';
import type { FundTransferGridRow } from '../api/fundTransferService';
import { FUND_TRANSFER_ENDPOINTS } from '../api/config';
import { Button, Card } from '../components/ui';
import { FundTransferFormDialog } from '../components/FundTransferFormDialog';
import { FundTransferCancelDialog } from '../components/FundTransferCancelDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function FundTransfersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('fundTransfers.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={() => setIsFormOpen(true)}>
          {t('fundTransfers.addButton')}
        </Button>
      </div>

      <GridView<FundTransferGridRow>
        ref={gridRef}
        dataUrl={FUND_TRANSFER_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('fundTransfers.empty')}
        onRowClick={(row) => navigate(`/fin/fund-transfers/${row.Id}`)}
        columns={[
          {
            propertyName: 'DocumentNumber',
            header: t('fundTransfers.fields.documentNumber'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'DocumentDate',
            header: t('fundTransfers.fields.documentDate'),
            sortable: true,
          },
          {
            propertyName: 'SourceFundTitle',
            header: t('fundTransfers.fields.source'),
            filterOperator: 'like',
          },
          {
            propertyName: 'TargetFundTitle',
            header: t('fundTransfers.fields.target'),
            filterOperator: 'like',
          },
          {
            propertyName: 'Amount',
            header: t('fundTransfers.fields.amount'),
            sortable: true,
            render: (row) => row.Amount.toLocaleString(),
          },
          {
            propertyName: 'Status',
            header: t('fundTransfers.fields.status'),
            render: (row) => t(`fundTransfers.statuses.${row.Status}`),
          },
        ]}
        actions={(row) =>
          row.Status === 2 ? (
            <Button variant="plain" size="xs" icon={<HiOutlineBan />} onClick={() => setCancellingId(row.Id)} />
          ) : null
        }
      />

      <FundTransferFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSaved={() => gridRef.current?.reload()} />

      <FundTransferCancelDialog
        isOpen={!!cancellingId}
        fundTransferId={cancellingId}
        onClose={() => setCancellingId(null)}
        onCancelled={() => gridRef.current?.reload()}
      />
    </Card>
  );
}
