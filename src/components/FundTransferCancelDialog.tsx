import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cancelFundTransfer } from '../api/fundTransferService';
import { FundTransferError, type FundTransferErrorCode } from '../types/fundTransfer';
import { Alert, Button, Dialog, FormItem, Input } from './ui';

interface FundTransferCancelDialogProps {
  isOpen: boolean;
  fundTransferId: string | null;
  onClose: () => void;
  onCancelled: () => void;
}

export function FundTransferCancelDialog({ isOpen, fundTransferId, onClose, onCancelled }: FundTransferCancelDialogProps) {
  const { t } = useTranslation();
  const [cancelReason, setCancelReason] = useState('');
  const [reversalDate, setReversalDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<FundTransferErrorCode | null>(null);

  const handleConfirm = async () => {
    if (!fundTransferId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await cancelFundTransfer(fundTransferId, cancelReason, reversalDate || null);
      setCancelReason('');
      setReversalDate('');
      onCancelled();
      onClose();
    } catch (err) {
      setError(err instanceof FundTransferError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={420}>
      <h4 className="mb-4">{t('fundTransfers.cancel.title')}</h4>

      {error && (
        <Alert type="danger" className="mb-3">
          {t(`fundTransfers.errors.${error}`)}
        </Alert>
      )}

      <FormItem label={t('fundTransfers.cancel.reason')} htmlFor="fundTransferCancelReason">
        <Input id="fundTransferCancelReason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} required />
      </FormItem>
      <FormItem label={t('fundTransfers.cancel.reversalDate')} htmlFor="fundTransferReversalDate">
        <Input id="fundTransferReversalDate" type="date" value={reversalDate} onChange={(event) => setReversalDate(event.target.value)} />
      </FormItem>

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={onClose} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button variant="solid" onClick={handleConfirm} loading={isSubmitting}>
          {t('fundTransfers.cancel.confirm')}
        </Button>
      </div>
    </Dialog>
  );
}
