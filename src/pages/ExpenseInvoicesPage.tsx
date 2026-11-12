import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBan, HiOutlinePlus } from 'react-icons/hi';
import type { ExpenseInvoiceGridRow } from '../api/expenseInvoiceService';
import { EXPENSE_INVOICE_ENDPOINTS } from '../api/config';
import { Button, Card } from '../components/ui';
import { ExpenseInvoiceFormDialog } from '../components/ExpenseInvoiceFormDialog';
import { ExpenseInvoiceCancelDialog } from '../components/ExpenseInvoiceCancelDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function ExpenseInvoicesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('expenseInvoices.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={() => setIsFormOpen(true)}>
          {t('expenseInvoices.addButton')}
        </Button>
      </div>

      <GridView<ExpenseInvoiceGridRow>
        ref={gridRef}
        dataUrl={EXPENSE_INVOICE_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('expenseInvoices.empty')}
        onRowClick={(row) => navigate(`/fin/expense-invoices/${row.Id}`)}
        columns={[
          {
            propertyName: 'DocumentNumber',
            header: t('expenseInvoices.fields.documentNumber'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'DocumentDate',
            header: t('expenseInvoices.fields.documentDate'),
            sortable: true,
          },
          {
            propertyName: 'PartyDisplayName',
            header: t('expenseInvoices.fields.party'),
            filterOperator: 'like',
          },
          {
            propertyName: 'PartyInvoiceNumber',
            header: t('expenseInvoices.fields.partyInvoiceNumber'),
            filterOperator: 'like',
          },
          {
            propertyName: 'TotalAmount',
            header: t('expenseInvoices.fields.totalAmount'),
            sortable: true,
            render: (row) => row.TotalAmount.toLocaleString(),
          },
          {
            propertyName: 'OpenAmount',
            header: t('expenseInvoices.fields.openAmount'),
            render: (row) => row.OpenAmount.toLocaleString(),
          },
          {
            propertyName: 'Status',
            header: t('expenseInvoices.fields.status'),
            render: (row) => t(`expenseInvoices.statuses.${row.Status}`),
          },
        ]}
        actions={(row) =>
          row.Status === 2 ? (
            <Button variant="plain" size="xs" icon={<HiOutlineBan />} onClick={() => setCancellingId(row.Id)} />
          ) : null
        }
      />

      <ExpenseInvoiceFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSaved={() => gridRef.current?.reload()} />

      <ExpenseInvoiceCancelDialog
        isOpen={!!cancellingId}
        expenseInvoiceId={cancellingId}
        onClose={() => setCancellingId(null)}
        onCancelled={() => gridRef.current?.reload()}
      />
    </Card>
  );
}
