import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cancelExpenseInvoice } from '../api/expenseInvoiceService';
import { ExpenseInvoiceError, type ExpenseInvoiceErrorCode } from '../types/expenseInvoice';
import { Alert, Button, Dialog, FormItem, Input } from './ui';

interface ExpenseInvoiceCancelDialogProps {
  isOpen: boolean;
  expenseInvoiceId: string | null;
  onClose: () => void;
  onCancelled: () => void;
}

export function ExpenseInvoiceCancelDialog({ isOpen, expenseInvoiceId, onClose, onCancelled }: ExpenseInvoiceCancelDialogProps) {
  const { t } = useTranslation();
  const [cancelReason, setCancelReason] = useState('');
  const [reversalDate, setReversalDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ExpenseInvoiceErrorCode | null>(null);

  const handleConfirm = async () => {
    if (!expenseInvoiceId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await cancelExpenseInvoice(expenseInvoiceId, cancelReason, reversalDate || null);
      setCancelReason('');
      setReversalDate('');
      onCancelled();
      onClose();
    } catch (err) {
      setError(err instanceof ExpenseInvoiceError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={420}>
      <h4 className="mb-4">{t('expenseInvoices.cancel.title')}</h4>

      {error && (
        <Alert type="danger" className="mb-3">
          {t(`expenseInvoices.errors.${error}`)}
        </Alert>
      )}

      <FormItem label={t('expenseInvoices.cancel.reason')} htmlFor="expenseInvoiceCancelReason">
        <Input id="expenseInvoiceCancelReason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} required />
      </FormItem>
      <FormItem label={t('expenseInvoices.cancel.reversalDate')} htmlFor="expenseInvoiceReversalDate">
        <Input id="expenseInvoiceReversalDate" type="date" value={reversalDate} onChange={(event) => setReversalDate(event.target.value)} />
      </FormItem>

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={onClose} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button variant="solid" onClick={handleConfirm} loading={isSubmitting}>
          {t('expenseInvoices.cancel.confirm')}
        </Button>
      </div>
    </Dialog>
  );
}
