import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cancelPartyPayment } from '../api/partyPaymentService';
import { PartyPaymentError, type PartyPaymentErrorCode } from '../types/partyPayment';
import { Alert, Button, Dialog, FormItem, Input } from './ui';

interface PartyPaymentCancelDialogProps {
  isOpen: boolean;
  partyPaymentId: string | null;
  onClose: () => void;
  onCancelled: () => void;
}

export function PartyPaymentCancelDialog({ isOpen, partyPaymentId, onClose, onCancelled }: PartyPaymentCancelDialogProps) {
  const { t } = useTranslation();
  const [cancelReason, setCancelReason] = useState('');
  const [reversalDate, setReversalDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<PartyPaymentErrorCode | null>(null);

  const handleConfirm = async () => {
    if (!partyPaymentId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await cancelPartyPayment(partyPaymentId, cancelReason, reversalDate || null);
      setCancelReason('');
      setReversalDate('');
      onCancelled();
      onClose();
    } catch (err) {
      setError(err instanceof PartyPaymentError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={420}>
      <h4 className="mb-4">{t('partyPayments.cancel.title')}</h4>

      {error && (
        <Alert type="danger" className="mb-3">
          {t(`partyPayments.errors.${error}`)}
        </Alert>
      )}

      <FormItem label={t('partyPayments.cancel.reason')} htmlFor="partyPaymentCancelReason">
        <Input id="partyPaymentCancelReason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} required />
      </FormItem>
      <FormItem label={t('partyPayments.cancel.reversalDate')} htmlFor="partyPaymentReversalDate">
        <Input id="partyPaymentReversalDate" type="date" value={reversalDate} onChange={(event) => setReversalDate(event.target.value)} />
      </FormItem>

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={onClose} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button variant="solid" onClick={handleConfirm} loading={isSubmitting}>
          {t('partyPayments.cancel.confirm')}
        </Button>
      </div>
    </Dialog>
  );
}
