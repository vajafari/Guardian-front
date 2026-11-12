import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBan, HiOutlinePlus } from 'react-icons/hi';
import type { CashTransferGridRow } from '../api/cashTransferService';
import { CASH_TRANSFER_ENDPOINTS } from '../api/config';
import { Button, Card } from '../components/ui';
import { CashTransferFormDialog } from '../components/CashTransferFormDialog';
import { CashTransferCancelDialog } from '../components/CashTransferCancelDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function CashTransfersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('cashTransfers.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={() => setIsFormOpen(true)}>
          {t('cashTransfers.addButton')}
        </Button>
      </div>

      <GridView<CashTransferGridRow>
        ref={gridRef}
        dataUrl={CASH_TRANSFER_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('cashTransfers.empty')}
        onRowClick={(row) => navigate(`/fin/cash-transfers/${row.Id}`)}
        columns={[
          {
            propertyName: 'DocumentNumber',
            header: t('cashTransfers.fields.documentNumber'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'DocumentDate',
            header: t('cashTransfers.fields.documentDate'),
            sortable: true,
          },
          {
            propertyName: 'SourceCashAccountTitle',
            header: t('cashTransfers.fields.source'),
            filterOperator: 'like',
          },
          {
            propertyName: 'DestinationCashAccountTitle',
            header: t('cashTransfers.fields.destination'),
            filterOperator: 'like',
          },
          {
            propertyName: 'Amount',
            header: t('cashTransfers.fields.amount'),
            sortable: true,
            render: (row) => row.Amount.toLocaleString(),
          },
          {
            propertyName: 'Status',
            header: t('cashTransfers.fields.status'),
            render: (row) => t(`cashTransfers.statuses.${row.Status}`),
          },
        ]}
        actions={(row) =>
          row.Status === 2 ? (
            <Button variant="plain" size="xs" icon={<HiOutlineBan />} onClick={() => setCancellingId(row.Id)} />
          ) : null
        }
      />

      <CashTransferFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSaved={() => gridRef.current?.reload()} />

      <CashTransferCancelDialog
        isOpen={!!cancellingId}
        cashTransferId={cancellingId}
        onClose={() => setCancellingId(null)}
        onCancelled={() => gridRef.current?.reload()}
      />
    </Card>
  );
}
