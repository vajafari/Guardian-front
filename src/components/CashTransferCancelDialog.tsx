import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cancelCashTransfer } from '../api/cashTransferService';
import { CashTransferError, type CashTransferErrorCode } from '../types/cashTransfer';
import { Alert, Button, Dialog, FormItem, Input } from './ui';

interface CashTransferCancelDialogProps {
  isOpen: boolean;
  cashTransferId: string | null;
  onClose: () => void;
  onCancelled: () => void;
}

export function CashTransferCancelDialog({ isOpen, cashTransferId, onClose, onCancelled }: CashTransferCancelDialogProps) {
  const { t } = useTranslation();
  const [cancelReason, setCancelReason] = useState('');
  const [reversalDate, setReversalDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<CashTransferErrorCode | null>(null);

  const handleConfirm = async () => {
    if (!cashTransferId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await cancelCashTransfer(cashTransferId, cancelReason, reversalDate || null);
      setCancelReason('');
      setReversalDate('');
      onCancelled();
      onClose();
    } catch (err) {
      setError(err instanceof CashTransferError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={420}>
      <h4 className="mb-4">{t('cashTransfers.cancel.title')}</h4>

      {error && (
        <Alert type="danger" className="mb-3">
          {t(`cashTransfers.errors.${error}`)}
        </Alert>
      )}

      <FormItem label={t('cashTransfers.cancel.reason')} htmlFor="cashTransferCancelReason">
        <Input id="cashTransferCancelReason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} required />
      </FormItem>
      <FormItem label={t('cashTransfers.cancel.reversalDate')} htmlFor="cashTransferReversalDate">
        <Input id="cashTransferReversalDate" type="date" value={reversalDate} onChange={(event) => setReversalDate(event.target.value)} />
      </FormItem>

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={onClose} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button variant="solid" onClick={handleConfirm} loading={isSubmitting}>
          {t('cashTransfers.cancel.confirm')}
        </Button>
      </div>
    </Dialog>
  );
}
