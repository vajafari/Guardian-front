import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineBan } from 'react-icons/hi';
import { getFundTransferById } from '../api/fundTransferService';
import type { FundTransferFullInfo } from '../types/fundTransfer';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { FundTransferCancelDialog } from '../components/FundTransferCancelDialog';

export function FundTransferDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [fundTransfer, setFundTransfer] = useState<FundTransferFullInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await getFundTransferById(id);
      setFundTransfer(result);
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

  const infoFields: Array<{ label: string; value: string }> = fundTransfer
    ? [
        { label: t('fundTransfers.fields.accountingEntity'), value: fundTransfer.accountingEntityTitle },
        { label: t('fundTransfers.fields.source'), value: fundTransfer.sourceFundTitle },
        { label: t('fundTransfers.fields.target'), value: fundTransfer.targetFundTitle },
        { label: t('fundTransfers.fields.amount'), value: fundTransfer.amount.toLocaleString() },
        { label: t('fundTransfers.fields.documentDate'), value: fundTransfer.documentDate },
        { label: t('fundTransfers.fields.status'), value: t(`fundTransfers.statuses.${fundTransfer.status}`) },
        { label: t('fundTransfers.fields.description'), value: fundTransfer.description },
      ]
    : [];

  if (fundTransfer?.status === 3) {
    infoFields.push({ label: t('fundTransfers.fields.cancelReason'), value: fundTransfer.cancelReason ?? '—' });
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="plain" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/fin/fund-transfers')}>
            {t('fundTransfers.detail.back')}
          </Button>
          <h1>{fundTransfer ? fundTransfer.documentNumber : t('fundTransfers.title')}</h1>
        </div>
        {fundTransfer && fundTransfer.status === 2 && (
          <Button size="sm" icon={<HiOutlineBan />} onClick={() => setIsCancelOpen(true)}>
            {t('fundTransfers.cancel.title')}
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
            <span>{t('fundTransfers.detail.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('fundTransfers.retry')}
            </Button>
          </div>
        </Alert>
      ) : !fundTransfer ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('fundTransfers.detail.notFound')}</p>
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

          <FundTransferCancelDialog
            isOpen={isCancelOpen}
            fundTransferId={fundTransfer.id}
            onClose={() => setIsCancelOpen(false)}
            onCancelled={load}
          />
        </>
      )}
    </Card>
  );
}
