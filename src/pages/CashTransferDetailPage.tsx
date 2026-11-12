import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineBan } from 'react-icons/hi';
import { getCashTransferById } from '../api/cashTransferService';
import type { CashTransferFullInfo } from '../types/cashTransfer';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { CashTransferCancelDialog } from '../components/CashTransferCancelDialog';

export function CashTransferDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [cashTransfer, setCashTransfer] = useState<CashTransferFullInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await getCashTransferById(id);
      setCashTransfer(result);
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

  const infoFields: Array<{ label: string; value: string }> = cashTransfer
    ? [
        { label: t('cashTransfers.fields.accountingEntity'), value: cashTransfer.accountingEntityTitle },
        { label: t('cashTransfers.fields.source'), value: cashTransfer.sourceCashAccountTitle },
        { label: t('cashTransfers.fields.destination'), value: cashTransfer.destinationCashAccountTitle },
        { label: t('cashTransfers.fields.amount'), value: cashTransfer.amount.toLocaleString() },
        { label: t('cashTransfers.fields.documentDate'), value: cashTransfer.documentDate },
        { label: t('cashTransfers.fields.status'), value: t(`cashTransfers.statuses.${cashTransfer.status}`) },
        { label: t('cashTransfers.fields.description'), value: cashTransfer.description ?? '—' },
      ]
    : [];

  if (cashTransfer?.status === 3) {
    infoFields.push({ label: t('cashTransfers.fields.cancelReason'), value: cashTransfer.cancelReason ?? '—' });
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="plain" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/fin/cash-transfers')}>
            {t('cashTransfers.detail.back')}
          </Button>
          <h1>{cashTransfer ? cashTransfer.documentNumber : t('cashTransfers.title')}</h1>
        </div>
        {cashTransfer && cashTransfer.status === 2 && (
          <Button size="sm" icon={<HiOutlineBan />} onClick={() => setIsCancelOpen(true)}>
            {t('cashTransfers.cancel.title')}
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
            <span>{t('cashTransfers.detail.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('cashTransfers.retry')}
            </Button>
          </div>
        </Alert>
      ) : !cashTransfer ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('cashTransfers.detail.notFound')}</p>
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

          <CashTransferCancelDialog
            isOpen={isCancelOpen}
            cashTransferId={cashTransfer.id}
            onClose={() => setIsCancelOpen(false)}
            onCancelled={load}
          />
        </>
      )}
    </Card>
  );
}
