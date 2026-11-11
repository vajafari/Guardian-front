import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBan, HiOutlinePlus } from 'react-icons/hi';
import type { ReceiptGridRow } from '../api/receiptService';
import { RECEIPT_ENDPOINTS } from '../api/config';
import { Button, Card } from '../components/ui';
import { ReceiptFormDialog } from '../components/ReceiptFormDialog';
import { ReceiptCancelDialog } from '../components/ReceiptCancelDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function ReceiptsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('receipts.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={() => setIsFormOpen(true)}>
          {t('receipts.addButton')}
        </Button>
      </div>

      <GridView<ReceiptGridRow>
        ref={gridRef}
        dataUrl={RECEIPT_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('receipts.empty')}
        onRowClick={(row) => navigate(`/fin/receipts/${row.Id}`)}
        columns={[
          {
            propertyName: 'DocumentNumber',
            header: t('receipts.fields.documentNumber'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'DocumentDate',
            header: t('receipts.fields.documentDate'),
            sortable: true,
          },
          {
            propertyName: 'PartyDisplayName',
            header: t('receipts.fields.party'),
            filterOperator: 'like',
          },
          {
            propertyName: 'CashAccountTitle',
            header: t('receipts.fields.cashAccount'),
            filterOperator: 'like',
          },
          {
            propertyName: 'Amount',
            header: t('receipts.fields.amount'),
            sortable: true,
            render: (row) => row.Amount.toLocaleString(),
          },
          {
            propertyName: 'AllocatedAmount',
            header: t('receipts.fields.allocatedAmount'),
            render: (row) => row.AllocatedAmount.toLocaleString(),
          },
          {
            propertyName: 'OverpaymentAmount',
            header: t('receipts.fields.overpaymentAmount'),
            render: (row) => row.OverpaymentAmount.toLocaleString(),
          },
          {
            propertyName: 'Status',
            header: t('receipts.fields.status'),
            render: (row) => t(`receipts.statuses.${row.Status}`),
          },
        ]}
        actions={(row) =>
          row.Status === 2 ? (
            <Button variant="plain" size="xs" icon={<HiOutlineBan />} onClick={() => setCancellingId(row.Id)} />
          ) : null
        }
      />

      <ReceiptFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSaved={() => gridRef.current?.reload()} />

      <ReceiptCancelDialog
        isOpen={!!cancellingId}
        receiptId={cancellingId}
        onClose={() => setCancellingId(null)}
        onCancelled={() => gridRef.current?.reload()}
      />
    </Card>
  );
}
