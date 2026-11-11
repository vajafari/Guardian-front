import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cancelLateFeeRun } from '../api/lateFeeRunService';
import { LateFeeRunError, type LateFeeRunErrorCode } from '../types/lateFeeRun';
import { Alert, Button, Dialog, FormItem, Input } from './ui';

interface LateFeeRunCancelDialogProps {
  isOpen: boolean;
  lateFeeRunId: string | null;
  onClose: () => void;
  onCancelled: () => void;
}

export function LateFeeRunCancelDialog({ isOpen, lateFeeRunId, onClose, onCancelled }: LateFeeRunCancelDialogProps) {
  const { t } = useTranslation();
  const [cancelReason, setCancelReason] = useState('');
  const [reversalDate, setReversalDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<LateFeeRunErrorCode | null>(null);

  const handleConfirm = async () => {
    if (!lateFeeRunId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await cancelLateFeeRun(lateFeeRunId, cancelReason, reversalDate || null);
      setCancelReason('');
      setReversalDate('');
      onCancelled();
      onClose();
    } catch (err) {
      setError(err instanceof LateFeeRunError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={420}>
      <h4 className="mb-4">{t('lateFeeRuns.cancel.title')}</h4>

      {error && (
        <Alert type="danger" className="mb-3">
          {t(`lateFeeRuns.errors.${error}`)}
        </Alert>
      )}

      <FormItem label={t('lateFeeRuns.cancel.reason')} htmlFor="lateFeeRunCancelReason">
        <Input id="lateFeeRunCancelReason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} required />
      </FormItem>
      <FormItem label={t('lateFeeRuns.cancel.reversalDate')} htmlFor="lateFeeRunReversalDate">
        <Input id="lateFeeRunReversalDate" type="date" value={reversalDate} onChange={(event) => setReversalDate(event.target.value)} />
      </FormItem>

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={onClose} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button variant="solid" onClick={handleConfirm} loading={isSubmitting}>
          {t('lateFeeRuns.cancel.confirm')}
        </Button>
      </div>
    </Dialog>
  );
}
