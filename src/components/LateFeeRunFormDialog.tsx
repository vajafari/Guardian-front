import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addLateFeeRun, previewLateFeeRun } from '../api/lateFeeRunService';
import { searchAccountingEntities } from '../api/finReferenceDataService';
import { LateFeeRunError, type LateFeeRunErrorCode, type LateFeeRunPreview } from '../types/lateFeeRun';
import type { FinAccountingEntity } from '../types/finReferenceData';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface LateFeeRunFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onIssued: () => void;
}

export function LateFeeRunFormDialog({ isOpen, onClose, onIssued }: LateFeeRunFormDialogProps) {
  const { t } = useTranslation();
  const [accountingEntityId, setAccountingEntityId] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [description, setDescription] = useState('');

  const [accountingEntities, setAccountingEntities] = useState<FinAccountingEntity[]>([]);

  const [preview, setPreview] = useState<LateFeeRunPreview | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<LateFeeRunErrorCode | null>(null);

  const reset = () => {
    setAccountingEntityId('');
    setDocumentDate('');
    setDescription('');
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

  const invalidatePreview = () => setPreview(null);

  const buildPayload = () => ({
    accountingEntityId,
    documentDate,
    description: description || null,
  });

  const handlePreview = async () => {
    setError(null);
    setIsPreviewing(true);
    try {
      const result = await previewLateFeeRun(buildPayload());
      setPreview(result);
    } catch (err) {
      setError(err instanceof LateFeeRunError ? err.code : 'unknown');
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
      await addLateFeeRun(buildPayload());
      onIssued();
      onClose();
    } catch (err) {
      setError(err instanceof LateFeeRunError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={560}>
      <h4 className="mb-4">{t('lateFeeRuns.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`lateFeeRuns.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('lateFeeRuns.fields.accountingEntity')} htmlFor="lateFeeRunAccountingEntity">
              <select
                id="lateFeeRunAccountingEntity"
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
            <FormItem label={t('lateFeeRuns.fields.documentDate')} htmlFor="lateFeeRunDocumentDate">
              <Input
                id="lateFeeRunDocumentDate"
                type="date"
                value={documentDate}
                onChange={(event) => {
                  setDocumentDate(event.target.value);
                  invalidatePreview();
                }}
                required
              />
            </FormItem>
          </div>

          <FormItem label={t('lateFeeRuns.fields.description')} htmlFor="lateFeeRunDescription">
            <Input
              id="lateFeeRunDescription"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                invalidatePreview();
              }}
            />
          </FormItem>

          <Button
            type="button"
            variant="default"
            block
            loading={isPreviewing}
            disabled={!accountingEntityId || !documentDate}
            onClick={handlePreview}
            className="mb-4"
          >
            {isPreviewing ? t('lateFeeRuns.previewing') : t('lateFeeRuns.previewButton')}
          </Button>

          {preview && (
            <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h5 className="mb-2">{t('lateFeeRuns.preview.title')}</h5>
              <p className="text-sm">
                {t('lateFeeRuns.preview.summary', { count: preview.feeCount, total: preview.feeTotal.toLocaleString() })}
              </p>
            </div>
          )}

          <Button variant="solid" block type="submit" loading={isSubmitting} disabled={!preview}>
            {isSubmitting ? t('lateFeeRuns.saving') : t('lateFeeRuns.runButton')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
