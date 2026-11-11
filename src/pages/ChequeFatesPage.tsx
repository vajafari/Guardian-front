import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBan, HiOutlinePlus } from 'react-icons/hi';
import type { ChequeFateGridRow } from '../api/chequeFateService';
import { CHEQUE_FATE_ENDPOINTS } from '../api/config';
import { Button, Card } from '../components/ui';
import { ChequeFateFormDialog } from '../components/ChequeFateFormDialog';
import { ChequeFateCancelDialog } from '../components/ChequeFateCancelDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function ChequeFatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('chequeFates.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={() => setIsFormOpen(true)}>
          {t('chequeFates.addButton')}
        </Button>
      </div>

      <GridView<ChequeFateGridRow>
        ref={gridRef}
        dataUrl={CHEQUE_FATE_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('chequeFates.empty')}
        onRowClick={(row) => navigate(`/fin/cheque-fates/${row.Id}`)}
        columns={[
          {
            propertyName: 'DocumentNumber',
            header: t('chequeFates.fields.documentNumber'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'AccountingEntityTitle',
            header: t('chequeFates.fields.accountingEntity'),
            filterOperator: 'like',
          },
          {
            propertyName: 'ChequeDirection',
            header: t('chequeFates.fields.chequeDirection'),
            render: (row) => t(`cheques.directions.${row.ChequeDirection}`),
          },
          {
            propertyName: 'FateKind',
            header: t('chequeFates.fields.fateKind'),
            render: (row) => t(`chequeFates.fateKinds.${row.FateKind}`),
          },
          {
            propertyName: 'DocumentDate',
            header: t('chequeFates.fields.documentDate'),
            sortable: true,
          },
          {
            propertyName: 'TotalAmount',
            header: t('chequeFates.fields.totalAmount'),
            sortable: true,
            render: (row) => row.TotalAmount.toLocaleString(),
          },
          {
            propertyName: 'Status',
            header: t('chequeFates.fields.status'),
            render: (row) => t(`chequeFates.statuses.${row.Status}`),
          },
        ]}
        actions={(row) =>
          row.Status === 2 ? (
            <Button variant="plain" size="xs" icon={<HiOutlineBan />} onClick={() => setCancellingId(row.Id)} />
          ) : null
        }
      />

      <ChequeFateFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSaved={() => gridRef.current?.reload()} />

      <ChequeFateCancelDialog
        isOpen={!!cancellingId}
        chequeFateId={cancellingId}
        onClose={() => setCancellingId(null)}
        onCancelled={() => gridRef.current?.reload()}
      />
    </Card>
  );
}
