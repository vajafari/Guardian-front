import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addCashTransfer } from '../api/cashTransferService';
import { searchAccountingEntities } from '../api/finReferenceDataService';
import { searchCashAccountsByEntity } from '../api/cashAccountService';
import { CashTransferError, type CashTransferErrorCode } from '../types/cashTransfer';
import type { CashAccount } from '../types/cashAccount';
import type { FinAccountingEntity } from '../types/finReferenceData';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface CashTransferFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function CashTransferFormDialog({ isOpen, onClose, onSaved }: CashTransferFormDialogProps) {
  const { t } = useTranslation();
  const [accountingEntityId, setAccountingEntityId] = useState('');
  const [sourceCashAccountId, setSourceCashAccountId] = useState('');
  const [destinationCashAccountId, setDestinationCashAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [description, setDescription] = useState('');

  const [accountingEntities, setAccountingEntities] = useState<FinAccountingEntity[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<CashTransferErrorCode | null>(null);

  const reset = () => {
    setAccountingEntityId('');
    setSourceCashAccountId('');
    setDestinationCashAccountId('');
    setAmount('');
    setDocumentDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setCashAccounts([]);
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      searchAccountingEntities().then(setAccountingEntities);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    setSourceCashAccountId('');
    setDestinationCashAccountId('');
    setCashAccounts([]);
    if (accountingEntityId) {
      searchCashAccountsByEntity(accountingEntityId).then(setCashAccounts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountingEntityId]);

  const handleSourceChange = (newSourceId: string) => {
    setSourceCashAccountId(newSourceId);
    if (newSourceId === destinationCashAccountId) {
      setDestinationCashAccountId('');
    }
  };

  const destinationOptions = cashAccounts.filter((account) => account.id !== sourceCashAccountId);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      accountingEntityId,
      documentDate,
      sourceCashAccountId,
      destinationCashAccountId,
      amount: Number(amount),
      description: description.trim() || null,
    };

    try {
      await addCashTransfer(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof CashTransferError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={600}>
      <h4 className="mb-4">{t('cashTransfers.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`cashTransfers.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('cashTransfers.fields.accountingEntity')} htmlFor="cashTransferAccountingEntity">
            <select
              id="cashTransferAccountingEntity"
              className="input"
              value={accountingEntityId}
              onChange={(event) => setAccountingEntityId(event.target.value)}
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

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('cashTransfers.fields.source')} htmlFor="cashTransferSource">
              <select
                id="cashTransferSource"
                className="input"
                value={sourceCashAccountId}
                onChange={(event) => handleSourceChange(event.target.value)}
                disabled={!accountingEntityId}
                required
              >
                <option value="">—</option>
                {cashAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.title}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('cashTransfers.fields.destination')} htmlFor="cashTransferDestination">
              <select
                id="cashTransferDestination"
                className="input"
                value={destinationCashAccountId}
                onChange={(event) => setDestinationCashAccountId(event.target.value)}
                disabled={!sourceCashAccountId}
                required
              >
                <option value="">—</option>
                {destinationOptions.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.title}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('cashTransfers.fields.amount')} htmlFor="cashTransferAmount">
              <Input id="cashTransferAmount" type="number" min={1} value={amount} onChange={(event) => setAmount(event.target.value)} required />
            </FormItem>
            <FormItem label={t('cashTransfers.fields.documentDate')} htmlFor="cashTransferDocumentDate">
              <Input
                id="cashTransferDocumentDate"
                type="date"
                value={documentDate}
                onChange={(event) => setDocumentDate(event.target.value)}
                required
              />
            </FormItem>
          </div>

          <FormItem label={t('cashTransfers.fields.description')} htmlFor="cashTransferDescription">
            <Input id="cashTransferDescription" value={description} onChange={(event) => setDescription(event.target.value)} />
          </FormItem>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('cashTransfers.saving') : t('cashTransfers.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
