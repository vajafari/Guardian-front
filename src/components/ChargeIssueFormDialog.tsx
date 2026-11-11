import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addChargeIssue, previewChargeIssue } from '../api/chargeIssueService';
import { searchAccountingEntities, searchFiscalPeriods, searchFiscalYears } from '../api/finReferenceDataService';
import { ChargeIssueError, type ChargeIssueErrorCode, type ChargeIssuePreview } from '../types/chargeIssue';
import type { FinAccountingEntity, FinFiscalPeriod, FinFiscalYear } from '../types/finReferenceData';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface ChargeIssueFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onIssued: () => void;
}

export function ChargeIssueFormDialog({ isOpen, onClose, onIssued }: ChargeIssueFormDialogProps) {
  const { t } = useTranslation();
  const [accountingEntityId, setAccountingEntityId] = useState('');
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [fiscalPeriodId, setFiscalPeriodId] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [description, setDescription] = useState('');
  const [excludeRent, setExcludeRent] = useState(false);
  const [runLateFee, setRunLateFee] = useState(false);

  const [accountingEntities, setAccountingEntities] = useState<FinAccountingEntity[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FinFiscalYear[]>([]);
  const [fiscalPeriods, setFiscalPeriods] = useState<FinFiscalPeriod[]>([]);

  const [preview, setPreview] = useState<ChargeIssuePreview | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ChargeIssueErrorCode | null>(null);

  const reset = () => {
    setAccountingEntityId('');
    setFiscalYearId('');
    setFiscalPeriodId('');
    setDocumentDate('');
    setDescription('');
    setExcludeRent(false);
    setRunLateFee(false);
    setFiscalYears([]);
    setFiscalPeriods([]);
    setPreview(null);
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      searchAccountingEntities().then(setAccountingEntities);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    setFiscalYearId('');
    setFiscalPeriods([]);
    setFiscalPeriodId('');
    setPreview(null);
    if (accountingEntityId) {
      searchFiscalYears(accountingEntityId).then(setFiscalYears);
    } else {
      setFiscalYears([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountingEntityId]);

  useEffect(() => {
    setFiscalPeriodId('');
    setPreview(null);
    if (fiscalYearId) {
      searchFiscalPeriods(fiscalYearId).then(setFiscalPeriods);
    } else {
      setFiscalPeriods([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fiscalYearId]);

  const invalidatePreview = () => setPreview(null);

  const buildPayload = () => ({
    accountingEntityId,
    fiscalPeriodId,
    documentDate: documentDate || null,
    description: description || null,
    excludeRent,
    runLateFee,
  });

  const handlePreview = async () => {
    setError(null);
    setIsPreviewing(true);
    try {
      const result = await previewChargeIssue(buildPayload());
      setPreview(result);
    } catch (err) {
      setError(err instanceof ChargeIssueError ? err.code : 'unknown');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!preview) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await addChargeIssue(buildPayload());
      onIssued();
      onClose();
    } catch (err) {
      setError(err instanceof ChargeIssueError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={720}>
      <h4 className="mb-4">{t('chargeIssues.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`chargeIssues.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('chargeIssues.fields.accountingEntity')} htmlFor="chargeIssueAccountingEntity">
              <select
                id="chargeIssueAccountingEntity"
                className="input"
                value={accountingEntityId}
                onChange={(event) => {
                  setAccountingEntityId(event.target.value);
                  invalidatePreview();
                }}
                required
              >
                <option value="">—</option>
                {accountingEntities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.title}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('chargeIssues.fields.fiscalYear')} htmlFor="chargeIssueFiscalYear">
              <select
                id="chargeIssueFiscalYear"
                className="input"
                value={fiscalYearId}
                onChange={(event) => {
                  setFiscalYearId(event.target.value);
                  invalidatePreview();
                }}
                disabled={!accountingEntityId}
                required
              >
                <option value="">—</option>
                {fiscalYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.title}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('chargeIssues.fields.fiscalPeriod')} htmlFor="chargeIssueFiscalPeriod">
              <select
                id="chargeIssueFiscalPeriod"
                className="input"
                value={fiscalPeriodId}
                onChange={(event) => {
                  setFiscalPeriodId(event.target.value);
                  invalidatePreview();
                }}
                disabled={!fiscalYearId}
                required
              >
                <option value="">—</option>
                {fiscalPeriods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.title}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('chargeIssues.fields.documentDate')} htmlFor="chargeIssueDocumentDate">
              <Input
                id="chargeIssueDocumentDate"
                type="date"
                value={documentDate}
                onChange={(event) => {
                  setDocumentDate(event.target.value);
                  invalidatePreview();
                }}
              />
            </FormItem>
            <FormItem label={t('chargeIssues.fields.description')} htmlFor="chargeIssueDescription">
              <Input
                id="chargeIssueDescription"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  invalidatePreview();
                }}
              />
            </FormItem>
          </div>

          <div className="flex flex-wrap gap-5 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none">
              <input
                type="checkbox"
                checked={excludeRent}
                onChange={(event) => {
                  setExcludeRent(event.target.checked);
                  invalidatePreview();
                }}
                className="accent-primary"
              />
              {t('chargeIssues.fields.excludeRent')}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none">
              <input
                type="checkbox"
                checked={runLateFee}
                onChange={(event) => {
                  setRunLateFee(event.target.checked);
                  invalidatePreview();
                }}
                className="accent-primary"
              />
              {t('chargeIssues.fields.runLateFee')}
            </label>
          </div>

          <Button
            type="button"
            variant="default"
            block
            loading={isPreviewing}
            disabled={!fiscalPeriodId}
            onClick={handlePreview}
            className="mb-4"
          >
            {isPreviewing ? t('chargeIssues.previewing') : t('chargeIssues.previewButton')}
          </Button>

          {preview && (
            <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h5 className="mb-2">{t('chargeIssues.preview.title')}</h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{t('chargeIssues.fields.dueDate')}</div>
                  <div>{preview.dueDate}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{t('chargeIssues.fields.totalAmount')}</div>
                  <div>{preview.totalAmount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{t('chargeIssues.preview.receivables')}</div>
                  <div>
                    {t('chargeIssues.preview.receivablesSummary', {
                      count: preview.receivableCount,
                      total: preview.receivableTotal.toLocaleString(),
                    })}
                  </div>
                </div>
                {runLateFee && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('chargeIssues.preview.lateFees')}</div>
                    <div>
                      {t('chargeIssues.preview.lateFeesSummary', {
                        count: preview.lateFeeCount,
                        total: preview.lateFeeTotal.toLocaleString(),
                      })}
                    </div>
                  </div>
                )}
              </div>

              {preview.components.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                      <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('chargeIssues.preview.componentTitle')}
                      </th>
                      <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('chargeIssues.preview.effectiveAmount')}
                      </th>
                      <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('chargeIssues.preview.issuedTotal')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.components.map((component, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <td className="py-1 px-2">{component.title}</td>
                        <td className="py-1 px-2">{component.effectiveAmount.toLocaleString()}</td>
                        <td className="py-1 px-2">{component.issuedTotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <Button variant="solid" block type="submit" loading={isSubmitting} disabled={!preview}>
            {isSubmitting ? t('chargeIssues.saving') : t('chargeIssues.issueButton')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
