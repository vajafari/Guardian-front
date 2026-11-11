import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addReceipt } from '../api/receiptService';
import { searchAccountingEntities } from '../api/finReferenceDataService';
import { searchCashAccountsByEntity } from '../api/cashAccountService';
import { searchOpenReceivablesByParty, type ReceivableSummary } from '../api/receivableService';
import { ReceiptError, type ReceiptErrorCode, type ReceiptPaymentMethod } from '../types/receipt';
import type { CashAccount } from '../types/cashAccount';
import type { FinAccountingEntity } from '../types/finReferenceData';
import { PartyPickerField } from './PartyPickerField';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

const PAYMENT_METHODS: ReceiptPaymentMethod[] = [1, 2, 3];

interface ReceiptFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ReceiptFormDialog({ isOpen, onClose, onSaved }: ReceiptFormDialogProps) {
  const { t } = useTranslation();
  const [accountingEntityId, setAccountingEntityId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [cashAccountId, setCashAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<ReceiptPaymentMethod>(3);
  const [documentDate, setDocumentDate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [autoAllocate, setAutoAllocate] = useState(true);
  const [allocationAmounts, setAllocationAmounts] = useState<Record<string, string>>({});

  const [accountingEntities, setAccountingEntities] = useState<FinAccountingEntity[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [openReceivables, setOpenReceivables] = useState<ReceivableSummary[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ReceiptErrorCode | null>(null);

  const reset = () => {
    setAccountingEntityId('');
    setPartyId('');
    setCashAccountId('');
    setPaymentMethod(3);
    setDocumentDate(new Date().toISOString().slice(0, 10));
    setAmount('');
    setDescription('');
    setAutoAllocate(true);
    setAllocationAmounts({});
    setCashAccounts([]);
    setOpenReceivables([]);
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
    setCashAccountId('');
    setCashAccounts([]);
    if (accountingEntityId) {
      searchCashAccountsByEntity(accountingEntityId).then(setCashAccounts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountingEntityId]);

  useEffect(() => {
    setOpenReceivables([]);
    setAllocationAmounts({});
    if (accountingEntityId && partyId) {
      searchOpenReceivablesByParty(accountingEntityId, partyId).then(setOpenReceivables);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountingEntityId, partyId]);

  const handleAllocationAmountChange = (receivableId: string, value: string) => {
    setAllocationAmounts((current) => ({ ...current, [receivableId]: value }));
  };

  const allocationTotal = Object.values(allocationAmounts).reduce((sum, value) => sum + (Number(value) || 0), 0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      accountingEntityId,
      documentDate,
      partyId,
      paymentMethod,
      cashAccountId,
      amount: Number(amount),
      description: description.trim() || null,
      autoAllocate,
      allocations: autoAllocate
        ? []
        : openReceivables
            .filter((receivable) => Number(allocationAmounts[receivable.id]) > 0)
            .map((receivable) => ({ receivableId: receivable.id, amount: Number(allocationAmounts[receivable.id]) })),
      overpaymentBuildingUnitId: null,
      overpaymentBuildingSpaceId: null,
    };

    try {
      await addReceipt(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ReceiptError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={720}>
      <h4 className="mb-4">{t('receipts.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`receipts.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('receipts.fields.accountingEntity')} htmlFor="receiptAccountingEntity">
            <select
              id="receiptAccountingEntity"
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

          <PartyPickerField isOpen={isOpen} onResolved={setPartyId} />

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('receipts.fields.cashAccount')} htmlFor="receiptCashAccount">
              <select
                id="receiptCashAccount"
                className="input"
                value={cashAccountId}
                onChange={(event) => setCashAccountId(event.target.value)}
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
            <FormItem label={t('receipts.fields.paymentMethod')} htmlFor="receiptPaymentMethod">
              <select
                id="receiptPaymentMethod"
                className="input"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(Number(event.target.value) as ReceiptPaymentMethod)}
                required
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {t(`receipts.paymentMethods.${method}`)}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('receipts.fields.amount')} htmlFor="receiptAmount">
              <Input id="receiptAmount" type="number" min={1} value={amount} onChange={(event) => setAmount(event.target.value)} required />
            </FormItem>
            <FormItem label={t('receipts.fields.documentDate')} htmlFor="receiptDocumentDate">
              <Input
                id="receiptDocumentDate"
                type="date"
                value={documentDate}
                onChange={(event) => setDocumentDate(event.target.value)}
                required
              />
            </FormItem>
          </div>

          <FormItem label={t('receipts.fields.description')} htmlFor="receiptDescription">
            <Input id="receiptDescription" value={description} onChange={(event) => setDescription(event.target.value)} />
          </FormItem>

          {partyId && (
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none mb-3">
                <input
                  type="checkbox"
                  checked={autoAllocate}
                  onChange={(event) => setAutoAllocate(event.target.checked)}
                  className="accent-primary"
                />
                {t('receipts.allocation.autoAllocate')}
              </label>

              {!autoAllocate && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  {openReceivables.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('receipts.allocation.noOpenReceivables')}</p>
                  ) : (
                    <>
                      <table className="w-full text-sm mb-2">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                            <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                              {t('receipts.allocation.receivableTitle')}
                            </th>
                            <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                              {t('receipts.allocation.dueDate')}
                            </th>
                            <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                              {t('receipts.allocation.openAmount')}
                            </th>
                            <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                              {t('receipts.allocation.allocateAmount')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {openReceivables.map((receivable) => (
                            <tr key={receivable.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                              <td className="py-1 px-2">{receivable.title}</td>
                              <td className="py-1 px-2">{receivable.dueDate}</td>
                              <td className="py-1 px-2">{receivable.openAmount.toLocaleString()}</td>
                              <td className="py-1 px-2">
                                <Input
                                  type="number"
                                  min={0}
                                  max={receivable.openAmount}
                                  value={allocationAmounts[receivable.id] ?? ''}
                                  onChange={(event) => handleAllocationAmountChange(receivable.id, event.target.value)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('receipts.allocation.allocatedTotal', { total: allocationTotal.toLocaleString() })}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('receipts.saving') : t('receipts.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
