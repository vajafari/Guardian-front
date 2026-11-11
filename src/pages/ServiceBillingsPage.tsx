import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBan, HiOutlinePlus } from 'react-icons/hi';
import type { ServiceBillingGridRow } from '../api/serviceBillingService';
import { SERVICE_BILLING_ENDPOINTS } from '../api/config';
import { Button, Card } from '../components/ui';
import { ServiceBillingFormDialog } from '../components/ServiceBillingFormDialog';
import { ServiceBillingCancelDialog } from '../components/ServiceBillingCancelDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function ServiceBillingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('serviceBillings.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={() => setIsFormOpen(true)}>
          {t('serviceBillings.addButton')}
        </Button>
      </div>

      <GridView<ServiceBillingGridRow>
        ref={gridRef}
        dataUrl={SERVICE_BILLING_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('serviceBillings.empty')}
        onRowClick={(row) => navigate(`/fin/service-billings/${row.Id}`)}
        columns={[
          {
            propertyName: 'DocumentNumber',
            header: t('serviceBillings.fields.documentNumber'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'DocumentDate',
            header: t('serviceBillings.fields.documentDate'),
            sortable: true,
          },
          {
            propertyName: 'PartyDisplayName',
            header: t('serviceBillings.fields.party'),
            filterOperator: 'like',
          },
          {
            propertyName: 'ServiceBillingTypeTitle',
            header: t('serviceBillings.fields.serviceBillingType'),
            filterOperator: 'like',
          },
          {
            propertyName: 'Title',
            header: t('serviceBillings.fields.title'),
            filterOperator: 'like',
          },
          {
            propertyName: 'Amount',
            header: t('serviceBillings.fields.amount'),
            sortable: true,
            render: (row) => row.Amount.toLocaleString(),
          },
          {
            propertyName: 'OpenAmount',
            header: t('serviceBillings.fields.openAmount'),
            render: (row) => row.OpenAmount.toLocaleString(),
          },
          {
            propertyName: 'Status',
            header: t('serviceBillings.fields.status'),
            render: (row) => t(`serviceBillings.statuses.${row.Status}`),
          },
        ]}
        actions={(row) =>
          row.Status === 2 ? (
            <Button variant="plain" size="xs" icon={<HiOutlineBan />} onClick={() => setCancellingId(row.Id)} />
          ) : null
        }
      />

      <ServiceBillingFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSaved={() => gridRef.current?.reload()} />

      <ServiceBillingCancelDialog
        isOpen={!!cancellingId}
        serviceBillingId={cancellingId}
        onClose={() => setCancellingId(null)}
        onCancelled={() => gridRef.current?.reload()}
      />
    </Card>
  );
}
