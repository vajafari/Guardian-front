import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addFundTransfer } from '../api/fundTransferService';
import { searchAccountingEntities, searchFunds } from '../api/finReferenceDataService';
import { FundTransferError, type FundTransferErrorCode } from '../types/fundTransfer';
import type { FinAccountingEntity, FinFund } from '../types/finReferenceData';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface FundTransferFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function FundTransferFormDialog({ isOpen, onClose, onSaved }: FundTransferFormDialogProps) {
  const { t } = useTranslation();
  const [accountingEntityId, setAccountingEntityId] = useState('');
  const [sourceFundId, setSourceFundId] = useState('');
  const [targetFundId, setTargetFundId] = useState('');
  const [amount, setAmount] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [description, setDescription] = useState('');

  const [accountingEntities, setAccountingEntities] = useState<FinAccountingEntity[]>([]);
  const [funds, setFunds] = useState<FinFund[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<FundTransferErrorCode | null>(null);

  const reset = () => {
    setAccountingEntityId('');
    setSourceFundId('');
    setTargetFundId('');
    setAmount('');
    setDocumentDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      Promise.all([searchAccountingEntities(), searchFunds()]).then(([accountingEntitiesResult, fundsResult]) => {
        setAccountingEntities(accountingEntitiesResult);
        setFunds(fundsResult);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSourceChange = (newSourceId: string) => {
    setSourceFundId(newSourceId);
    if (newSourceId === targetFundId) {
      setTargetFundId('');
    }
  };

  const targetOptions = funds.filter((fund) => fund.id !== sourceFundId);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      accountingEntityId,
      documentDate,
      sourceFundId,
      targetFundId,
      amount: Number(amount),
      description: description.trim(),
    };

    try {
      await addFundTransfer(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof FundTransferError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={600}>
      <h4 className="mb-4">{t('fundTransfers.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`fundTransfers.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('fundTransfers.fields.accountingEntity')} htmlFor="fundTransferAccountingEntity">
            <select
              id="fundTransferAccountingEntity"
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
            <FormItem label={t('fundTransfers.fields.source')} htmlFor="fundTransferSource">
              <select id="fundTransferSource" className="input" value={sourceFundId} onChange={(event) => handleSourceChange(event.target.value)} required>
                <option value="">—</option>
                {funds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.title}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('fundTransfers.fields.target')} htmlFor="fundTransferTarget">
              <select
                id="fundTransferTarget"
                className="input"
                value={targetFundId}
                onChange={(event) => setTargetFundId(event.target.value)}
                disabled={!sourceFundId}
                required
              >
                <option value="">—</option>
                {targetOptions.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.title}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('fundTransfers.fields.amount')} htmlFor="fundTransferAmount">
              <Input id="fundTransferAmount" type="number" min={1} value={amount} onChange={(event) => setAmount(event.target.value)} required />
            </FormItem>
            <FormItem label={t('fundTransfers.fields.documentDate')} htmlFor="fundTransferDocumentDate">
              <Input
                id="fundTransferDocumentDate"
                type="date"
                value={documentDate}
                onChange={(event) => setDocumentDate(event.target.value)}
                required
              />
            </FormItem>
          </div>

          <FormItem label={t('fundTransfers.fields.description')} htmlFor="fundTransferDescription">
            <Input id="fundTransferDescription" value={description} onChange={(event) => setDescription(event.target.value)} required />
          </FormItem>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('fundTransfers.saving') : t('fundTransfers.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
