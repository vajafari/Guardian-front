import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cancelReceipt } from '../api/receiptService';
import { ReceiptError, type ReceiptErrorCode } from '../types/receipt';
import { Alert, Button, Dialog, FormItem, Input } from './ui';

interface ReceiptCancelDialogProps {
  isOpen: boolean;
  receiptId: string | null;
  onClose: () => void;
  onCancelled: () => void;
}

export function ReceiptCancelDialog({ isOpen, receiptId, onClose, onCancelled }: ReceiptCancelDialogProps) {
  const { t } = useTranslation();
  const [cancelReason, setCancelReason] = useState('');
  const [reversalDate, setReversalDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ReceiptErrorCode | null>(null);

  const handleConfirm = async () => {
    if (!receiptId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await cancelReceipt(receiptId, cancelReason, reversalDate || null);
      setCancelReason('');
      setReversalDate('');
      onCancelled();
      onClose();
    } catch (err) {
      setError(err instanceof ReceiptError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={420}>
      <h4 className="mb-4">{t('receipts.cancel.title')}</h4>

      {error && (
        <Alert type="danger" className="mb-3">
          {t(`receipts.errors.${error}`)}
        </Alert>
      )}

      <FormItem label={t('receipts.cancel.reason')} htmlFor="receiptCancelReason">
        <Input id="receiptCancelReason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} required />
      </FormItem>
      <FormItem label={t('receipts.cancel.reversalDate')} htmlFor="receiptReversalDate">
        <Input id="receiptReversalDate" type="date" value={reversalDate} onChange={(event) => setReversalDate(event.target.value)} />
      </FormItem>

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={onClose} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button variant="solid" onClick={handleConfirm} loading={isSubmitting}>
          {t('receipts.cancel.confirm')}
        </Button>
      </div>
    </Dialog>
  );
}
