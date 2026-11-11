import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cancelChequeFate } from '../api/chequeFateService';
import { ChequeFateError, type ChequeFateErrorCode } from '../types/chequeFate';
import { Alert, Button, Dialog, FormItem, Input } from './ui';

interface ChequeFateCancelDialogProps {
  isOpen: boolean;
  chequeFateId: string | null;
  onClose: () => void;
  onCancelled: () => void;
}

export function ChequeFateCancelDialog({ isOpen, chequeFateId, onClose, onCancelled }: ChequeFateCancelDialogProps) {
  const { t } = useTranslation();
  const [cancelReason, setCancelReason] = useState('');
  const [reversalDate, setReversalDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ChequeFateErrorCode | null>(null);

  const handleConfirm = async () => {
    if (!chequeFateId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await cancelChequeFate(chequeFateId, cancelReason, reversalDate || null);
      setCancelReason('');
      setReversalDate('');
      onCancelled();
      onClose();
    } catch (err) {
      setError(err instanceof ChequeFateError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={420}>
      <h4 className="mb-4">{t('chequeFates.cancel.title')}</h4>

      {error && (
        <Alert type="danger" className="mb-3">
          {t(`chequeFates.errors.${error}`)}
        </Alert>
      )}

      <FormItem label={t('chequeFates.cancel.reason')} htmlFor="chequeFateCancelReason">
        <Input id="chequeFateCancelReason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} required />
      </FormItem>
      <FormItem label={t('chequeFates.cancel.reversalDate')} htmlFor="chequeFateReversalDate">
        <Input id="chequeFateReversalDate" type="date" value={reversalDate} onChange={(event) => setReversalDate(event.target.value)} />
      </FormItem>

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={onClose} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button variant="solid" onClick={handleConfirm} loading={isSubmitting}>
          {t('chequeFates.cancel.confirm')}
        </Button>
      </div>
    </Dialog>
  );
}
