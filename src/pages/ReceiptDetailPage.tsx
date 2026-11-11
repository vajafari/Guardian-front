import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineBan } from 'react-icons/hi';
import { getReceiptById } from '../api/receiptService';
import type { ReceiptFullInfo } from '../types/receipt';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { ReceiptCancelDialog } from '../components/ReceiptCancelDialog';

export function ReceiptDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<ReceiptFullInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await getReceiptById(id);
      setReceipt(result);
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

  const infoFields: Array<{ label: string; value: string }> = receipt
    ? [
        { label: t('receipts.fields.accountingEntity'), value: receipt.accountingEntityTitle },
        { label: t('receipts.fields.party'), value: receipt.partyDisplayName ?? '—' },
        { label: t('receipts.fields.cashAccount'), value: receipt.cashAccountTitle ?? '—' },
        { label: t('receipts.fields.paymentMethod'), value: receipt.paymentMethod ? t(`receipts.paymentMethods.${receipt.paymentMethod}`) : '—' },
        { label: t('receipts.fields.amount'), value: receipt.amount.toLocaleString() },
        { label: t('receipts.fields.allocatedAmount'), value: receipt.allocatedAmount.toLocaleString() },
        { label: t('receipts.fields.overpaymentAmount'), value: receipt.overpaymentAmount.toLocaleString() },
        { label: t('receipts.fields.documentDate'), value: receipt.documentDate },
        { label: t('receipts.fields.status'), value: t(`receipts.statuses.${receipt.status}`) },
        { label: t('receipts.fields.description'), value: receipt.description ?? '—' },
      ]
    : [];

  if (receipt?.status === 3) {
    infoFields.push({ label: t('receipts.fields.cancelReason'), value: receipt.cancelReason ?? '—' });
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="plain" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/fin/receipts')}>
            {t('receipts.detail.back')}
          </Button>
          <h1>{receipt ? receipt.documentNumber : t('receipts.title')}</h1>
        </div>
        {receipt && receipt.status === 2 && (
          <Button size="sm" icon={<HiOutlineBan />} onClick={() => setIsCancelOpen(true)}>
            {t('receipts.cancel.title')}
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
            <span>{t('receipts.detail.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('receipts.retry')}
            </Button>
          </div>
        </Alert>
      ) : !receipt ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('receipts.detail.notFound')}</p>
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

          <h4 className="mb-3">{t('receipts.detail.allocations')}</h4>
          {receipt.allocationsFullInfo.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('receipts.allocation.noOpenReceivables')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('receipts.allocation.receivableTitle')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('receipts.allocation.dueDate')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('receipts.fields.amount')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.allocationsFullInfo.map((allocation) => (
                    <tr key={allocation.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-2 px-3">{allocation.receivableTitle}</td>
                      <td className="py-2 px-3">{allocation.receivableDueDate}</td>
                      <td className="py-2 px-3">{allocation.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <ReceiptCancelDialog
            isOpen={isCancelOpen}
            receiptId={receipt.id}
            onClose={() => setIsCancelOpen(false)}
            onCancelled={load}
          />
        </>
      )}
    </Card>
  );
}
