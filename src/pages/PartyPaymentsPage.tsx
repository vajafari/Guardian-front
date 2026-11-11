import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBan, HiOutlinePlus } from 'react-icons/hi';
import type { PartyPaymentGridRow } from '../api/partyPaymentService';
import { PARTY_PAYMENT_ENDPOINTS } from '../api/config';
import { Button, Card } from '../components/ui';
import { PartyPaymentFormDialog } from '../components/PartyPaymentFormDialog';
import { PartyPaymentCancelDialog } from '../components/PartyPaymentCancelDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function PartyPaymentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('partyPayments.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={() => setIsFormOpen(true)}>
          {t('partyPayments.addButton')}
        </Button>
      </div>

      <GridView<PartyPaymentGridRow>
        ref={gridRef}
        dataUrl={PARTY_PAYMENT_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('partyPayments.empty')}
        onRowClick={(row) => navigate(`/fin/party-payments/${row.Id}`)}
        columns={[
          {
            propertyName: 'DocumentNumber',
            header: t('partyPayments.fields.documentNumber'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'DocumentDate',
            header: t('partyPayments.fields.documentDate'),
            sortable: true,
          },
          {
            propertyName: 'PartyDisplayName',
            header: t('partyPayments.fields.party'),
            filterOperator: 'like',
          },
          {
            propertyName: 'CashAccountTitle',
            header: t('partyPayments.fields.cashAccount'),
            filterOperator: 'like',
          },
          {
            propertyName: 'Amount',
            header: t('partyPayments.fields.amount'),
            sortable: true,
            render: (row) => row.Amount.toLocaleString(),
          },
          {
            propertyName: 'UnsettledAmount',
            header: t('partyPayments.fields.unsettledAmount'),
            render: (row) => row.UnsettledAmount.toLocaleString(),
          },
          {
            propertyName: 'Status',
            header: t('partyPayments.fields.status'),
            render: (row) => t(`partyPayments.statuses.${row.Status}`),
          },
        ]}
        actions={(row) =>
          row.Status === 2 ? (
            <Button variant="plain" size="xs" icon={<HiOutlineBan />} onClick={() => setCancellingId(row.Id)} />
          ) : null
        }
      />

      <PartyPaymentFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSaved={() => gridRef.current?.reload()} />

      <PartyPaymentCancelDialog
        isOpen={!!cancellingId}
        partyPaymentId={cancellingId}
        onClose={() => setCancellingId(null)}
        onCancelled={() => gridRef.current?.reload()}
      />
    </Card>
  );
}
