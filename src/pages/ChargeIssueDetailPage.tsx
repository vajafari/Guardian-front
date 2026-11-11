import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineBan } from 'react-icons/hi';
import { getChargeIssueById } from '../api/chargeIssueService';
import type { ChargeIssueFullInfo } from '../types/chargeIssue';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { ChargeIssueCancelDialog } from '../components/ChargeIssueCancelDialog';

export function ChargeIssueDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [chargeIssue, setChargeIssue] = useState<ChargeIssueFullInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await getChargeIssueById(id);
      setChargeIssue(result);
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

  const infoFields: Array<{ label: string; value: string }> = chargeIssue
    ? [
        { label: t('chargeIssues.fields.accountingEntity'), value: chargeIssue.accountingEntityTitle },
        { label: t('chargeIssues.fields.fiscalPeriod'), value: chargeIssue.fiscalPeriodTitle },
        { label: t('chargeIssues.fields.periodStart'), value: chargeIssue.periodStart },
        { label: t('chargeIssues.fields.documentDate'), value: chargeIssue.documentDate },
        { label: t('chargeIssues.fields.dueDate'), value: chargeIssue.dueDate },
        { label: t('chargeIssues.fields.status'), value: t(`chargeIssues.statuses.${chargeIssue.status}`) },
        { label: t('chargeIssues.fields.totalAmount'), value: chargeIssue.totalAmount.toLocaleString() },
        { label: t('chargeIssues.fields.activeTotalAmount'), value: chargeIssue.activeTotalAmount.toLocaleString() },
      ]
    : [];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="plain" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/fin/charge-issues')}>
            {t('chargeIssues.detail.back')}
          </Button>
          <h1>{chargeIssue ? chargeIssue.documentNumber : t('chargeIssues.title')}</h1>
        </div>
        {chargeIssue && chargeIssue.status === 2 && (
          <Button size="sm" icon={<HiOutlineBan />} onClick={() => setIsCancelOpen(true)}>
            {t('chargeIssues.cancel.title')}
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
            <span>{t('chargeIssues.detail.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('chargeIssues.retry')}
            </Button>
          </div>
        </Alert>
      ) : !chargeIssue ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('chargeIssues.detail.notFound')}</p>
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

          <h4 className="mb-3">{t('chargeIssues.preview.title')}</h4>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                  <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                    {t('chargeIssues.preview.componentTitle')}
                  </th>
                  <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                    {t('chargeIssues.preview.effectiveAmount')}
                  </th>
                  <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                    {t('chargeIssues.preview.issuedTotal')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {chargeIssue.componentsFullInfo.map((component, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <td className="py-2 px-3">{component.title}</td>
                    <td className="py-2 px-3">{component.effectiveAmount.toLocaleString()}</td>
                    <td className="py-2 px-3">{component.issuedTotal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="mb-3">{t('chargeIssues.detail.lines')}</h4>
          {chargeIssue.linesFullInfo.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('chargeIssues.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('chargeIssues.detail.unitOrSpace')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('chargeIssues.detail.payer')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('chargeIssues.preview.componentTitle')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('chargeIssues.fields.totalAmount')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chargeIssue.linesFullInfo.map((line) => {
                    const item = chargeIssue.itemsFullInfo.find((candidate) => candidate.id === line.chargeIssueItemId);
                    return (
                      <tr key={line.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <td className="py-2 px-3">{item?.buildingUnitTitle ?? item?.buildingSpaceTitle ?? '—'}</td>
                        <td className="py-2 px-3">{line.payerDisplayName}</td>
                        <td className="py-2 px-3">{line.componentTitle ?? t('chargeIssues.detail.rent')}</td>
                        <td className="py-2 px-3">{line.amount.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <ChargeIssueCancelDialog
            isOpen={isCancelOpen}
            chargeIssueId={chargeIssue.id}
            onClose={() => setIsCancelOpen(false)}
            onCancelled={load}
          />
        </>
      )}
    </Card>
  );
}
