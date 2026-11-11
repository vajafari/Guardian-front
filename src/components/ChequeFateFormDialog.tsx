import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addChequeFate } from '../api/chequeFateService';
import { searchAccountingEntities } from '../api/finReferenceDataService';
import { searchCashAccountsByEntity } from '../api/cashAccountService';
import { searchChequesByEntity } from '../api/chequeService';
import { ChequeFateError, type ChequeFateErrorCode, type ChequeFateKind } from '../types/chequeFate';
import type { ChequeDirection, ChequeFullInfo, ChequeStatus } from '../types/cheque';
import type { CashAccount } from '../types/cashAccount';
import type { FinAccountingEntity } from '../types/finReferenceData';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

const CHEQUE_DIRECTIONS: ChequeDirection[] = [1, 2];
const ALL_FATE_KINDS: ChequeFateKind[] = [1, 2, 3, 4];

function allowedFateKinds(direction: ChequeDirection): ChequeFateKind[] {
  return direction === 1 ? ALL_FATE_KINDS : ([2, 3, 4] as ChequeFateKind[]);
}

/** Which ChequeStatus values a cheque must currently be in to be eligible for this direction+fateKind combo. */
function allowedStatuses(direction: ChequeDirection, fateKind: ChequeFateKind): ChequeStatus[] {
  if (direction === 2) return [1]; // Issued: only ever Pending in this pass (no PartyPayment yet)
  switch (fateKind) {
    case 1: // Deposited
      return [1];
    case 3: // Bounced
      return [1, 2, 6];
    default: // Cleared, Returned
      return [1, 2];
  }
}

interface ChequeFateFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ChequeFateFormDialog({ isOpen, onClose, onSaved }: ChequeFateFormDialogProps) {
  const { t } = useTranslation();
  const [accountingEntityId, setAccountingEntityId] = useState('');
  const [chequeDirection, setChequeDirection] = useState<ChequeDirection>(1);
  const [fateKind, setFateKind] = useState<ChequeFateKind>(1);
  const [cashAccountId, setCashAccountId] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [description, setDescription] = useState('');
  const [selectedChequeIds, setSelectedChequeIds] = useState<string[]>([]);
  const [clearedAmounts, setClearedAmounts] = useState<Record<string, string>>({});

  const [accountingEntities, setAccountingEntities] = useState<FinAccountingEntity[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [eligibleCheques, setEligibleCheques] = useState<ChequeFullInfo[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ChequeFateErrorCode | null>(null);

  const needsBankAccount = fateKind === 1 || fateKind === 2;

  const reset = () => {
    setAccountingEntityId('');
    setChequeDirection(1);
    setFateKind(1);
    setCashAccountId('');
    setDocumentDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setSelectedChequeIds([]);
    setClearedAmounts({});
    setCashAccounts([]);
    setEligibleCheques([]);
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
    setCashAccounts([]);
    if (accountingEntityId) {
      searchCashAccountsByEntity(accountingEntityId).then((accounts) => setCashAccounts(accounts.filter((a) => a.cashAccountType === 1)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountingEntityId]);

  useEffect(() => {
    setSelectedChequeIds([]);
    setClearedAmounts({});
    setEligibleCheques([]);
    if (accountingEntityId) {
      searchChequesByEntity(accountingEntityId, { direction: chequeDirection, statuses: allowedStatuses(chequeDirection, fateKind) }).then(
        setEligibleCheques,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountingEntityId, chequeDirection, fateKind]);

  const handleDirectionChange = (newDirection: ChequeDirection) => {
    setChequeDirection(newDirection);
    if (!allowedFateKinds(newDirection).includes(fateKind)) {
      setFateKind(2);
    }
  };

  const toggleCheque = (chequeId: string) => {
    setSelectedChequeIds((current) =>
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
      chequeDirection,
      fateKind,
      description: description.trim() || null,
      items: selectedChequeIds.map((chequeId) => ({
        chequeId,
        cashAccountId: needsBankAccount ? cashAccountId || null : null,
        clearedAmount: clearedAmounts[chequeId] ? Number(clearedAmounts[chequeId]) : null,
      })),
    };

    try {
      await addChequeFate(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ChequeFateError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={720}>
      <h4 className="mb-4">{t('chequeFates.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`chequeFates.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('chequeFates.fields.accountingEntity')} htmlFor="chequeFateAccountingEntity">
            <select
              id="chequeFateAccountingEntity"
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
            <FormItem label={t('chequeFates.fields.chequeDirection')} htmlFor="chequeFateDirection">
              <div className="flex items-center gap-4 h-full">
                {CHEQUE_DIRECTIONS.map((direction) => (
                  <label key={direction} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="chequeFateDirection"
                      checked={chequeDirection === direction}
                      onChange={() => handleDirectionChange(direction)}
                    />
                    {t(`cheques.directions.${direction}`)}
                  </label>
                ))}
              </div>
            </FormItem>
            <FormItem label={t('chequeFates.fields.fateKind')} htmlFor="chequeFateKind">
              <select
                id="chequeFateKind"
                className="input"
                value={fateKind}
                onChange={(event) => setFateKind(Number(event.target.value) as ChequeFateKind)}
                required
              >
                {allowedFateKinds(chequeDirection).map((kind) => (
                  <option key={kind} value={kind}>
                    {t(`chequeFates.fateKinds.${kind}`)}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          {needsBankAccount && (
            <FormItem label={t('chequeFates.fields.cashAccount')} htmlFor="chequeFateCashAccount">
              <select
                id="chequeFateCashAccount"
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

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('chequeFates.fields.documentDate')} htmlFor="chequeFateDocumentDate">
              <Input
                id="chequeFateDocumentDate"
                type="date"
                value={documentDate}
                onChange={(event) => setDocumentDate(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('chequeFates.fields.description')} htmlFor="chequeFateDescription">
              <Input id="chequeFateDescription" value={description} onChange={(event) => setDescription(event.target.value)} />
            </FormItem>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4">
            <h5 className="mb-2">{t('chequeFates.selectCheques')}</h5>
            {eligibleCheques.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('chequeFates.noEligibleCheques')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-1 px-2 w-8"></th>
                    <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('cheques.fields.chequeNumber')}
                    </th>
                    <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('cheques.fields.party')}
                    </th>
                    <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('cheques.fields.dueDate')}
                    </th>
                    <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('cheques.fields.amount')}
                    </th>
                    {fateKind === 2 && (
                      <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('chequeFates.partialClearAmount')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {eligibleCheques.map((cheque) => (
                    <tr key={cheque.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-1 px-2">
                        <input
                          type="checkbox"
                          checked={selectedChequeIds.includes(cheque.id)}
                          onChange={() => toggleCheque(cheque.id)}
                        />
                      </td>
                      <td className="py-1 px-2">{cheque.chequeNumber}</td>
                      <td className="py-1 px-2">{cheque.partyDisplayName}</td>
                      <td className="py-1 px-2">{cheque.dueDate}</td>
                      <td className="py-1 px-2">{cheque.amount.toLocaleString()}</td>
                      {fateKind === 2 && (
                        <td className="py-1 px-2">
                          <Input
                            type="number"
                            min={0}
                            max={cheque.amount}
                            disabled={!selectedChequeIds.includes(cheque.id)}
                            value={clearedAmounts[cheque.id] ?? ''}
                            onChange={(event) =>
                              setClearedAmounts((current) => ({ ...current, [cheque.id]: event.target.value }))
                            }
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Button variant="solid" block type="submit" loading={isSubmitting} disabled={selectedChequeIds.length === 0}>
            {isSubmitting ? t('chequeFates.saving') : t('chequeFates.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
