import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineBan } from 'react-icons/hi';
import { getExpenseInvoiceById } from '../api/expenseInvoiceService';
import type { ExpenseInvoiceFullInfo } from '../types/expenseInvoice';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { ExpenseInvoiceCancelDialog } from '../components/ExpenseInvoiceCancelDialog';

export function ExpenseInvoiceDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [expenseInvoice, setExpenseInvoice] = useState<ExpenseInvoiceFullInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await getExpenseInvoiceById(id);
      setExpenseInvoice(result);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const infoFields: Array<{ label: string; value: string }> = expenseInvoice
    ? [
        { label: t('expenseInvoices.fields.accountingEntity'), value: expenseInvoice.accountingEntityTitle },
        { label: t('expenseInvoices.fields.party'), value: expenseInvoice.partyDisplayName },
        { label: t('expenseInvoices.fields.partyInvoiceNumber'), value: expenseInvoice.partyInvoiceNumber ?? '—' },
        { label: t('expenseInvoices.fields.building'), value: expenseInvoice.buildingTitle ?? '—' },
        { label: t('expenseInvoices.fields.totalAmount'), value: expenseInvoice.totalAmount.toLocaleString() },
        { label: t('expenseInvoices.fields.paidAmount'), value: expenseInvoice.paidAmount.toLocaleString() },
        { label: t('expenseInvoices.fields.settledAmount'), value: expenseInvoice.settledAmount.toLocaleString() },
        { label: t('expenseInvoices.fields.openAmount'), value: expenseInvoice.openAmount.toLocaleString() },
        { label: t('expenseInvoices.fields.documentDate'), value: expenseInvoice.documentDate },
        { label: t('expenseInvoices.fields.status'), value: t(`expenseInvoices.statuses.${expenseInvoice.status}`) },
        { label: t('expenseInvoices.fields.description'), value: expenseInvoice.description ?? '—' },
      ]
    : [];

  if (expenseInvoice?.status === 3) {
    infoFields.push({ label: t('expenseInvoices.fields.cancelReason'), value: expenseInvoice.cancelReason ?? '—' });
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="plain" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/fin/expense-invoices')}>
            {t('expenseInvoices.detail.back')}
          </Button>
          <h1>{expenseInvoice ? expenseInvoice.documentNumber : t('expenseInvoices.title')}</h1>
        </div>
        {expenseInvoice && expenseInvoice.status === 2 && (
          <Button size="sm" icon={<HiOutlineBan />} onClick={() => setIsCancelOpen(true)}>
            {t('expenseInvoices.cancel.title')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size={28} />
        </div>
      ) : hasError ? (
        <Alert type="danger" className="mb-2">
          <div className="flex items-center justify-between gap-4">
            <span>{t('expenseInvoices.detail.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('expenseInvoices.retry')}
            </Button>
          </div>
        </Alert>
      ) : !expenseInvoice ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('expenseInvoices.detail.notFound')}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 mb-6">
            {infoFields.map((field) => (
              <div key={field.label}>
                <div className="text-xs text-gray-500 dark:text-gray-400">{field.label}</div>
                <div className="text-sm">{field.value}</div>
              </div>
            ))}
          </div>

          {expenseInvoice.itemsFullInfo.length > 0 && (
            <>
              <h4 className="mb-3">{t('expenseInvoices.detail.items')}</h4>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                      <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('expenseInvoices.items.costCategory')}
                      </th>
                      <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('expenseInvoices.items.fund')}
                      </th>
                      <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('expenseInvoices.items.buildingSpace')}
                      </th>
                      <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('expenseInvoices.items.amount')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseInvoice.itemsFullInfo.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <td className="py-2 px-3">{item.costCategoryTitle}</td>
                        <td className="py-2 px-3">{item.fundTitle}</td>
                        <td className="py-2 px-3">{item.buildingSpaceTitle ?? '—'}</td>
                        <td className="py-2 px-3">{item.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {expenseInvoice.settlementsFullInfo.length > 0 && (
            <>
              <h4 className="mb-3">{t('expenseInvoices.detail.settlements')}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                      <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('expenseInvoices.detail.settlementPayment')}
                      </th>
                      <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('expenseInvoices.detail.settlementDate')}
                      </th>
                      <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('expenseInvoices.items.amount')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseInvoice.settlementsFullInfo.map((settlement) => (
                      <tr key={settlement.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <td className="py-2 px-3">{settlement.partyPaymentNumber ?? '—'}</td>
                        <td className="py-2 px-3">{settlement.settlementDate}</td>
                        <td className="py-2 px-3">{settlement.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <ExpenseInvoiceCancelDialog
            isOpen={isCancelOpen}
            expenseInvoiceId={expenseInvoice.id}
            onClose={() => setIsCancelOpen(false)}
            onCancelled={load}
          />
        </>
      )}
    </Card>
  );
}
