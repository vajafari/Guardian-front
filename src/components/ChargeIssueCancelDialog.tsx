import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cancelChargeIssue } from '../api/chargeIssueService';
import { ChargeIssueError, type ChargeIssueErrorCode } from '../types/chargeIssue';
import { Alert, Button, Dialog, FormItem, Input } from './ui';

interface ChargeIssueCancelDialogProps {
  isOpen: boolean;
  chargeIssueId: string | null;
  onClose: () => void;
  onCancelled: () => void;
}

export function ChargeIssueCancelDialog({ isOpen, chargeIssueId, onClose, onCancelled }: ChargeIssueCancelDialogProps) {
  const { t } = useTranslation();
  const [cancelReason, setCancelReason] = useState('');
  const [reversalDate, setReversalDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ChargeIssueErrorCode | null>(null);

  const handleConfirm = async () => {
    if (!chargeIssueId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await cancelChargeIssue(chargeIssueId, cancelReason, reversalDate || null);
      setCancelReason('');
      setReversalDate('');
      onCancelled();
      onClose();
    } catch (err) {
      setError(err instanceof ChargeIssueError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={420}>
      <h4 className="mb-4">{t('chargeIssues.cancel.title')}</h4>

      {error && (
        <Alert type="danger" className="mb-3">
          {t(`chargeIssues.errors.${error}`)}
        </Alert>
      )}

      <FormItem label={t('chargeIssues.cancel.reason')} htmlFor="chargeIssueCancelReason">
        <Input id="chargeIssueCancelReason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} required />
      </FormItem>
      <FormItem label={t('chargeIssues.cancel.reversalDate')} htmlFor="chargeIssueReversalDate">
        <Input id="chargeIssueReversalDate" type="date" value={reversalDate} onChange={(event) => setReversalDate(event.target.value)} />
      </FormItem>

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={onClose} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button variant="solid" onClick={handleConfirm} loading={isSubmitting}>
          {t('chargeIssues.cancel.confirm')}
        </Button>
      </div>
    </Dialog>
  );
}
