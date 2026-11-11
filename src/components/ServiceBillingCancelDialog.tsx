import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cancelServiceBilling } from '../api/serviceBillingService';
import { ServiceBillingError, type ServiceBillingErrorCode } from '../types/serviceBilling';
import { Alert, Button, Dialog, FormItem, Input } from './ui';

interface ServiceBillingCancelDialogProps {
  isOpen: boolean;
  serviceBillingId: string | null;
  onClose: () => void;
  onCancelled: () => void;
}

export function ServiceBillingCancelDialog({ isOpen, serviceBillingId, onClose, onCancelled }: ServiceBillingCancelDialogProps) {
  const { t } = useTranslation();
  const [cancelReason, setCancelReason] = useState('');
  const [reversalDate, setReversalDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ServiceBillingErrorCode | null>(null);

  const handleConfirm = async () => {
    if (!serviceBillingId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await cancelServiceBilling(serviceBillingId, cancelReason, reversalDate || null);
      setCancelReason('');
      setReversalDate('');
      onCancelled();
      onClose();
    } catch (err) {
      setError(err instanceof ServiceBillingError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={420}>
      <h4 className="mb-4">{t('serviceBillings.cancel.title')}</h4>

      {error && (
        <Alert type="danger" className="mb-3">
          {t(`serviceBillings.errors.${error}`)}
        </Alert>
      )}

      <FormItem label={t('serviceBillings.cancel.reason')} htmlFor="serviceBillingCancelReason">
        <Input id="serviceBillingCancelReason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} required />
      </FormItem>
      <FormItem label={t('serviceBillings.cancel.reversalDate')} htmlFor="serviceBillingReversalDate">
        <Input id="serviceBillingReversalDate" type="date" value={reversalDate} onChange={(event) => setReversalDate(event.target.value)} />
      </FormItem>

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={onClose} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button variant="solid" onClick={handleConfirm} loading={isSubmitting}>
          {t('serviceBillings.cancel.confirm')}
        </Button>
      </div>
    </Dialog>
  );
}
