import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineTrash } from 'react-icons/hi';
import { addPartyPayment } from '../api/partyPaymentService';
import { searchAccountingEntities, getPayableToPartiesAccountId } from '../api/finReferenceDataService';
import { searchCashAccountsByEntity } from '../api/cashAccountService';
import { searchChequesByEntity } from '../api/chequeService';
import { searchOpenExpenseInvoicesByParty } from '../api/expenseInvoiceService';
import type { OpenExpenseInvoiceSummary } from '../types/expenseInvoice';
import {
  PartyPaymentError,
  type PartyPaymentErrorCode,
  type PartyPaymentIssuedChequePayload,
  type PartyPaymentMethod,
} from '../types/partyPayment';
import type { CashAccount } from '../types/cashAccount';
import type { ChequeFullInfo } from '../types/cheque';
import type { FinAccountingEntity } from '../types/finReferenceData';
import { PartyPickerField } from './PartyPickerField';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

const PAYMENT_METHODS: PartyPaymentMethod[] = [1, 2, 3];

interface IssuedChequeRow extends PartyPaymentIssuedChequePayload {
  id: string;
}

function createEmptyIssuedChequeRow(): IssuedChequeRow {
  return {
    id: crypto.randomUUID(),
    chequeNumber: '',
    sayadId: null,
    bankName: null,
    cashAccountId: '',
    issueDate: null,
    dueDate: '',
    amount: 0,
    description: null,
  };
}

interface PartyPaymentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function PartyPaymentFormDialog({ isOpen, onClose, onSaved }: PartyPaymentFormDialogProps) {
  const { t } = useTranslation();
  const [accountingEntityId, setAccountingEntityId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PartyPaymentMethod>(1);
  const [cashAccountId, setCashAccountId] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [issuedCheques, setIssuedCheques] = useState<IssuedChequeRow[]>([createEmptyIssuedChequeRow()]);
  const [selectedEndorsedChequeIds, setSelectedEndorsedChequeIds] = useState<string[]>([]);

  const [accountingEntities, setAccountingEntities] = useState<FinAccountingEntity[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [pendingReceivedCheques, setPendingReceivedCheques] = useState<ChequeFullInfo[]>([]);
  const [settledAccountId, setSettledAccountId] = useState('');
  const [openInvoices, setOpenInvoices] = useState<OpenExpenseInvoiceSummary[]>([]);
  const [settlementAmounts, setSettlementAmounts] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<PartyPaymentErrorCode | null>(null);

  const reset = () => {
    setAccountingEntityId('');
    setPartyId('');
    setPaymentMethod(1);
    setCashAccountId('');
    setDocumentDate(new Date().toISOString().slice(0, 10));
    setAmount('');
    setDescription('');
    setIssuedCheques([createEmptyIssuedChequeRow()]);
    setSelectedEndorsedChequeIds([]);
    setCashAccounts([]);
    setPendingReceivedCheques([]);
    setOpenInvoices([]);
    setSettlementAmounts({});
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      searchAccountingEntities().then(setAccountingEntities);
      getPayableToPartiesAccountId().then(setSettledAccountId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    setCashAccountId('');
    setCashAccounts([]);
    setPendingReceivedCheques([]);
    setSelectedEndorsedChequeIds([]);
    if (accountingEntityId) {
      searchCashAccountsByEntity(accountingEntityId).then(setCashAccounts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountingEntityId]);

  useEffect(() => {
    setSelectedEndorsedChequeIds([]);
    if (accountingEntityId && paymentMethod === 3) {
      searchChequesByEntity(accountingEntityId, { direction: 1, statuses: [1] }).then(setPendingReceivedCheques);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountingEntityId, paymentMethod]);

  // Endorsing hands over a cheque received from ANY party to pay this one — the backend only scopes by
  // AccountingEntity + ChequeDirection=Received + Status=Pending, not by the cheque's original payer.

  useEffect(() => {
    setOpenInvoices([]);
    setSettlementAmounts({});
    if (accountingEntityId && partyId) {
      searchOpenExpenseInvoicesByParty(accountingEntityId, partyId).then(setOpenInvoices);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountingEntityId, partyId]);

  const handleSettlementAmountChange = (invoiceId: string, value: string) => {
    setSettlementAmounts((current) => ({ ...current, [invoiceId]: value }));
  };

  const settlementTotal = Object.values(settlementAmounts).reduce((sum, value) => sum + (Number(value) || 0), 0);

  const updateIssuedChequeLine = (id: string, patch: Partial<IssuedChequeRow>) => {
    setIssuedCheques((lines) => lines.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  };

  const addIssuedChequeLine = () => setIssuedCheques((lines) => [...lines, createEmptyIssuedChequeRow()]);
  const removeIssuedChequeLine = (id: string) => setIssuedCheques((lines) => lines.filter((line) => line.id !== id));
  const issuedChequeTotal = issuedCheques.reduce((sum, line) => sum + (line.amount || 0), 0);

  const toggleEndorsedCheque = (chequeId: string) => {
    setSelectedEndorsedChequeIds((current) =>
      current.includes(chequeId) ? current.filter((id) => id !== chequeId) : [...current, chequeId],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      accountingEntityId,
      documentDate,
      partyId,
      settledAccountId,
      paymentMethod,
      cashAccountId: paymentMethod === 1 ? cashAccountId : null,
      amount: Number(amount),
      description: description.trim() || null,
      issuedCheques:
        paymentMethod === 2
          ? issuedCheques.map((line) => ({
              chequeNumber: line.chequeNumber,
              sayadId: line.sayadId,
              bankName: line.bankName,
              cashAccountId: line.cashAccountId,
              issueDate: line.issueDate,
              dueDate: line.dueDate,
              amount: line.amount,
              description: line.description,
            }))
          : [],
      endorsedChequeIds: paymentMethod === 3 ? selectedEndorsedChequeIds : [],
      settlements: openInvoices
        .filter((invoice) => Number(settlementAmounts[invoice.id]) > 0)
        .map((invoice) => ({ expenseInvoiceId: invoice.id, amount: Number(settlementAmounts[invoice.id]) })),
    };

    try {
      await addPartyPayment(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof PartyPaymentError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={720}>
      <h4 className="mb-4">{t('partyPayments.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`partyPayments.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('partyPayments.fields.accountingEntity')} htmlFor="partyPaymentAccountingEntity">
            <select
              id="partyPaymentAccountingEntity"
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

          <FormItem label={t('partyPayments.fields.paymentMethod')} htmlFor="partyPaymentMethod">
            <select
              id="partyPaymentMethod"
              className="input"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(Number(event.target.value) as PartyPaymentMethod)}
              required
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {t(`partyPayments.paymentMethods.${method}`)}
                </option>
              ))}
            </select>
          </FormItem>

          {paymentMethod === 1 && (
            <FormItem label={t('partyPayments.fields.cashAccount')} htmlFor="partyPaymentCashAccount">
              <select
                id="partyPaymentCashAccount"
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
          )}

          {paymentMethod === 2 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4">
              <h5 className="mb-2">{t('partyPayments.issuedCheques.title')}</h5>
              <table className="w-full text-sm mb-2">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('cheques.fields.chequeNumber')}
                    </th>
                    <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('cheques.fields.cashAccount')}
                    </th>
                    <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('cheques.fields.dueDate')}
                    </th>
                    <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('cheques.fields.amount')}
                    </th>
                    <th className="py-1 px-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {issuedCheques.map((line) => (
                    <tr key={line.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-1 px-2">
                        <Input
                          value={line.chequeNumber}
                          onChange={(event) => updateIssuedChequeLine(line.id, { chequeNumber: event.target.value })}
                        />
                      </td>
                      <td className="py-1 px-2">
                        <select
                          className="input"
                          value={line.cashAccountId}
                          onChange={(event) => updateIssuedChequeLine(line.id, { cashAccountId: event.target.value })}
                        >
                          <option value="">—</option>
                          {cashAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.title}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-1 px-2">
                        <Input
                          type="date"
                          value={line.dueDate}
                          onChange={(event) => updateIssuedChequeLine(line.id, { dueDate: event.target.value })}
                        />
                      </td>
                      <td className="py-1 px-2">
                        <Input
                          type="number"
                          min={1}
                          value={line.amount || ''}
                          onChange={(event) => updateIssuedChequeLine(line.id, { amount: Number(event.target.value) })}
                        />
                      </td>
                      <td className="py-1 px-2">
                        {issuedCheques.length > 1 && (
                          <Button
                            type="button"
                            variant="plain"
                            size="xs"
                            icon={<HiOutlineTrash />}
                            onClick={() => removeIssuedChequeLine(line.id)}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between">
                <Button type="button" size="sm" onClick={addIssuedChequeLine}>
                  {t('partyPayments.issuedCheques.addLine')}
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('partyPayments.issuedCheques.total', { total: issuedChequeTotal.toLocaleString() })}
                </p>
              </div>
            </div>
          )}

          {paymentMethod === 3 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4">
              <h5 className="mb-2">{t('partyPayments.endorsedCheques.title')}</h5>
              {pendingReceivedCheques.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('partyPayments.endorsedCheques.noneAvailable')}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                      <th className="py-1 px-2 w-8"></th>
                      <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('cheques.fields.chequeNumber')}
                      </th>
                      <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('partyPayments.endorsedCheques.originalParty')}
                      </th>
                      <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('cheques.fields.dueDate')}
                      </th>
                      <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('cheques.fields.amount')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReceivedCheques.map((cheque) => (
                      <tr key={cheque.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <td className="py-1 px-2">
                          <input
                            type="checkbox"
                            checked={selectedEndorsedChequeIds.includes(cheque.id)}
                            onChange={() => toggleEndorsedCheque(cheque.id)}
                          />
                        </td>
                        <td className="py-1 px-2">{cheque.chequeNumber}</td>
                        <td className="py-1 px-2">{cheque.partyDisplayName}</td>
                        <td className="py-1 px-2">{cheque.dueDate}</td>
                        <td className="py-1 px-2">{cheque.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {partyId && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4">
              <h5 className="mb-2">{t('partyPayments.settlements.title')}</h5>
              {openInvoices.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('partyPayments.settlements.noOpenInvoices')}</p>
              ) : (
                <>
                  <table className="w-full text-sm mb-2">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                        <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                          {t('partyPayments.settlements.invoiceNumber')}
                        </th>
                        <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                          {t('partyPayments.settlements.invoiceDate')}
                        </th>
                        <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                          {t('partyPayments.settlements.openAmount')}
                        </th>
                        <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                          {t('partyPayments.settlements.settleAmount')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {openInvoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                          <td className="py-1 px-2">{invoice.documentNumber}</td>
                          <td className="py-1 px-2">{invoice.documentDate}</td>
                          <td className="py-1 px-2">{invoice.openAmount.toLocaleString()}</td>
                          <td className="py-1 px-2">
                            <Input
                              type="number"
                              min={0}
                              max={invoice.openAmount}
                              value={settlementAmounts[invoice.id] ?? ''}
                              onChange={(event) => handleSettlementAmountChange(invoice.id, event.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('partyPayments.settlements.settledTotal', { total: settlementTotal.toLocaleString() })}
                  </p>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('partyPayments.fields.amount')} htmlFor="partyPaymentAmount">
              <Input id="partyPaymentAmount" type="number" min={1} value={amount} onChange={(event) => setAmount(event.target.value)} required />
            </FormItem>
            <FormItem label={t('partyPayments.fields.documentDate')} htmlFor="partyPaymentDocumentDate">
              <Input
                id="partyPaymentDocumentDate"
                type="date"
                value={documentDate}
                onChange={(event) => setDocumentDate(event.target.value)}
                required
              />
            </FormItem>
          </div>

          <FormItem label={t('partyPayments.fields.description')} htmlFor="partyPaymentDescription">
            <Input id="partyPaymentDescription" value={description} onChange={(event) => setDescription(event.target.value)} />
          </FormItem>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('partyPayments.saving') : t('partyPayments.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
