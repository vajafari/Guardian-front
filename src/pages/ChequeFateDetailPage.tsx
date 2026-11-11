import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineBan } from 'react-icons/hi';
import { getChequeFateById } from '../api/chequeFateService';
import type { ChequeFateFullInfo } from '../types/chequeFate';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { ChequeFateCancelDialog } from '../components/ChequeFateCancelDialog';

export function ChequeFateDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [chequeFate, setChequeFate] = useState<ChequeFateFullInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await getChequeFateById(id);
      setChequeFate(result);
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

  const infoFields: Array<{ label: string; value: string }> = chequeFate
    ? [
        { label: t('chequeFates.fields.accountingEntity'), value: chequeFate.accountingEntityTitle },
        { label: t('chequeFates.fields.chequeDirection'), value: t(`cheques.directions.${chequeFate.chequeDirection}`) },
        { label: t('chequeFates.fields.fateKind'), value: t(`chequeFates.fateKinds.${chequeFate.fateKind}`) },
        { label: t('chequeFates.fields.documentDate'), value: chequeFate.documentDate },
        { label: t('chequeFates.fields.totalAmount'), value: chequeFate.totalAmount.toLocaleString() },
        { label: t('chequeFates.fields.status'), value: t(`chequeFates.statuses.${chequeFate.status}`) },
        { label: t('chequeFates.fields.description'), value: chequeFate.description ?? '—' },
      ]
    : [];

  if (chequeFate?.status === 3) {
    infoFields.push({ label: t('chequeFates.fields.cancelReason'), value: chequeFate.cancelReason ?? '—' });
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="plain" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/fin/cheque-fates')}>
            {t('chequeFates.detail.back')}
          </Button>
          <h1>{chequeFate ? chequeFate.documentNumber : t('chequeFates.title')}</h1>
        </div>
        {chequeFate && chequeFate.status === 2 && (
          <Button size="sm" icon={<HiOutlineBan />} onClick={() => setIsCancelOpen(true)}>
            {t('chequeFates.cancel.title')}
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
            <span>{t('chequeFates.detail.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('chequeFates.retry')}
            </Button>
          </div>
        </Alert>
      ) : !chequeFate ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('chequeFates.detail.notFound')}</p>
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

          <h4 className="mb-3">{t('chequeFates.detail.items')}</h4>
          {chequeFate.itemsFullInfo.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('chequeFates.noEligibleCheques')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('cheques.fields.chequeNumber')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('cheques.fields.dueDate')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('cheques.fields.amount')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('chequeFates.partialClearAmount')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chequeFate.itemsFullInfo.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-2 px-3">{item.chequeNumber}</td>
                      <td className="py-2 px-3">{item.chequeDueDate}</td>
                      <td className="py-2 px-3">{item.chequeAmount.toLocaleString()}</td>
                      <td className="py-2 px-3">{item.clearedAmount != null ? item.clearedAmount.toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <ChequeFateCancelDialog
            isOpen={isCancelOpen}
            chequeFateId={chequeFate.id}
            onClose={() => setIsCancelOpen(false)}
            onCancelled={load}
          />
        </>
      )}
    </Card>
  );
}
