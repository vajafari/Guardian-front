import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineBan } from 'react-icons/hi';
import { getLateFeeRunById } from '../api/lateFeeRunService';
import type { LateFeeRunFullInfo } from '../types/lateFeeRun';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { LateFeeRunCancelDialog } from '../components/LateFeeRunCancelDialog';

export function LateFeeRunDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [lateFeeRun, setLateFeeRun] = useState<LateFeeRunFullInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await getLateFeeRunById(id);
      setLateFeeRun(result);
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

  const infoFields: Array<{ label: string; value: string }> = lateFeeRun
    ? [
        { label: t('lateFeeRuns.fields.accountingEntity'), value: lateFeeRun.accountingEntityTitle },
        { label: t('lateFeeRuns.fields.documentDate'), value: lateFeeRun.documentDate },
        { label: t('lateFeeRuns.fields.status'), value: t(`lateFeeRuns.statuses.${lateFeeRun.status}`) },
        { label: t('lateFeeRuns.fields.feeCount'), value: String(lateFeeRun.feeCount) },
        { label: t('lateFeeRuns.fields.totalAmount'), value: lateFeeRun.totalAmount.toLocaleString() },
        { label: t('lateFeeRuns.fields.description'), value: lateFeeRun.description ?? '—' },
      ]
    : [];

  if (lateFeeRun?.status === 3) {
    infoFields.push({ label: t('lateFeeRuns.fields.cancelReason'), value: lateFeeRun.cancelReason ?? '—' });
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="plain" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/fin/late-fee-runs')}>
            {t('lateFeeRuns.detail.back')}
          </Button>
          <h1>{lateFeeRun ? lateFeeRun.documentNumber : t('lateFeeRuns.title')}</h1>
        </div>
        {lateFeeRun && lateFeeRun.status === 2 && (
          <Button size="sm" icon={<HiOutlineBan />} onClick={() => setIsCancelOpen(true)}>
            {t('lateFeeRuns.cancel.title')}
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
            <span>{t('lateFeeRuns.detail.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('lateFeeRuns.retry')}
            </Button>
          </div>
        </Alert>
      ) : !lateFeeRun ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('lateFeeRuns.detail.notFound')}</p>
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

          <h4 className="mb-3">{t('lateFeeRuns.detail.fees')}</h4>
          {lateFeeRun.feesFullInfo.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('lateFeeRuns.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('lateFeeRuns.detail.unitOrSpace')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('lateFeeRuns.detail.party')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('lateFeeRuns.fields.amount')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('lateFeeRuns.detail.feePeriod')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('lateFeeRuns.fields.openAmount')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lateFeeRun.feesFullInfo.map((fee) => (
                    <tr key={fee.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-2 px-3">{fee.buildingUnitTitle ?? fee.buildingSpaceTitle ?? '—'}</td>
                      <td className="py-2 px-3">{fee.partyDisplayName}</td>
                      <td className="py-2 px-3">{fee.amount.toLocaleString()}</td>
                      <td className="py-2 px-3">
                        {fee.feeFromDate} – {fee.feeToDate}
                      </td>
                      <td className="py-2 px-3">{fee.openAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <LateFeeRunCancelDialog
            isOpen={isCancelOpen}
            lateFeeRunId={lateFeeRun.id}
            onClose={() => setIsCancelOpen(false)}
            onCancelled={load}
          />
        </>
      )}
    </Card>
  );
}
