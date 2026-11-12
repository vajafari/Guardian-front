import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addBuildingDepositMovement } from '../api/buildingDepositMovementService';
import { searchCashAccountsByEntity } from '../api/cashAccountService';
import { searchFunds } from '../api/finReferenceDataService';
import { searchOpenReceivablesByParty, type ReceivableSummary } from '../api/receivableService';
import { BuildingDepositMovementError, type BuildingDepositMovementErrorCode, type BuildingDepositMovementKind } from '../types/buildingDepositMovement';
import type { BuildingDepositFullInfo } from '../types/buildingDeposit';
import type { CashAccount } from '../types/cashAccount';
import type { FinFund } from '../types/finReferenceData';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

const MOVEMENT_KINDS: BuildingDepositMovementKind[] = [1, 2, 3, 4];

interface BuildingDepositMovementFormDialogProps {
  isOpen: boolean;
  buildingDeposit: BuildingDepositFullInfo | null;
  onClose: () => void;
  onSaved: () => void;
}

export function BuildingDepositMovementFormDialog({ isOpen, buildingDeposit, onClose, onSaved }: BuildingDepositMovementFormDialogProps) {
  const { t } = useTranslation();
  const [movementKind, setMovementKind] = useState<BuildingDepositMovementKind>(1);
  const [amount, setAmount] = useState('');
  const [cashAccountId, setCashAccountId] = useState('');
  const [fundId, setFundId] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [description, setDescription] = useState('');
  const [settlementAmounts, setSettlementAmounts] = useState<Record<string, string>>({});

  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [funds, setFunds] = useState<FinFund[]>([]);
  const [openReceivables, setOpenReceivables] = useState<ReceivableSummary[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<BuildingDepositMovementErrorCode | null>(null);

  const isSettled = movementKind === 4;
  const settlementTotal = Object.values(settlementAmounts).reduce((sum, value) => sum + (Number(value) || 0), 0);

  const reset = () => {
    setMovementKind(1);
    setAmount('');
    setCashAccountId('');
    setFundId('');
    setDocumentDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setSettlementAmounts({});
    setError(null);
  };

  useEffect(() => {
    if (isOpen && buildingDeposit) {
      reset();
      searchCashAccountsByEntity(buildingDeposit.accountingEntityId).then(setCashAccounts);
      searchFunds().then(setFunds);
      searchOpenReceivablesByParty(buildingDeposit.accountingEntityId, buildingDeposit.partyId).then(setOpenReceivables);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, buildingDeposit]);

  useEffect(() => {
    setCashAccountId('');
    setFundId('');
    setSettlementAmounts({});
    if (movementKind !== 1) {
      setAmount('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movementKind]);

  const handleSettlementAmountChange = (receivableId: string, value: string) => {
    setSettlementAmounts((current) => ({ ...current, [receivableId]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!buildingDeposit) return;
    setError(null);
    setIsSubmitting(true);

    const settlements = openReceivables
      .filter((receivable) => Number(settlementAmounts[receivable.id]) > 0)
      .map((receivable) => ({ receivableId: receivable.id, amount: Number(settlementAmounts[receivable.id]) }));

    const payload = {
      buildingDepositId: buildingDeposit.id,
      documentDate,
      movementKind,
      amount: isSettled ? settlementTotal : Number(amount),
      cashAccountId: movementKind === 1 || movementKind === 2 ? cashAccountId || null : null,
      fundId: movementKind === 3 ? fundId || null : null,
      description: description.trim() || null,
      settlements: isSettled ? settlements : [],
    };

    try {
      await addBuildingDepositMovement(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof BuildingDepositMovementError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={680}>
      <h4 className="mb-4">{t('buildingDeposits.movements.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`buildingDeposits.movements.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('buildingDeposits.movements.fields.movementKind')} htmlFor="buildingDepositMovementKind">
            <select
              id="buildingDepositMovementKind"
              className="input"
              value={movementKind}
              onChange={(event) => setMovementKind(Number(event.target.value) as BuildingDepositMovementKind)}
              required
            >
              {MOVEMENT_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {t(`buildingDeposits.movements.movementKinds.${kind}`)}
                </option>
              ))}
            </select>
          </FormItem>

          {(movementKind === 1 || movementKind === 2) && (
            <FormItem label={t('buildingDeposits.movements.fields.cashAccount')} htmlFor="buildingDepositMovementCashAccount">
              <select
                id="buildingDepositMovementCashAccount"
                className="input"
                value={cashAccountId}
                onChange={(event) => setCashAccountId(event.target.value)}
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

          {movementKind === 3 && (
            <FormItem label={t('buildingDeposits.movements.fields.fund')} htmlFor="buildingDepositMovementFund">
              <select id="buildingDepositMovementFund" className="input" value={fundId} onChange={(event) => setFundId(event.target.value)} required>
                <option value="">—</option>
                {funds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.title}
                  </option>
                ))}
              </select>
            </FormItem>
          )}

          {isSettled && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4">
              <h5 className="mb-2">{t('buildingDeposits.movements.settlements.title')}</h5>
              {openReceivables.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('buildingDeposits.movements.settlements.noOpenReceivables')}</p>
              ) : (
                <>
                  <table className="w-full text-sm mb-2">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                        <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                          {t('buildingDeposits.movements.settlements.receivableTitle')}
                        </th>
                        <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                          {t('buildingDeposits.movements.settlements.openAmount')}
                        </th>
                        <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                          {t('buildingDeposits.movements.settlements.allocateAmount')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {openReceivables.map((receivable) => (
                        <tr key={receivable.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                          <td className="py-1 px-2">{receivable.title}</td>
                          <td className="py-1 px-2">{receivable.openAmount.toLocaleString()}</td>
                          <td className="py-1 px-2">
                            <Input
                              type="number"
                              min={0}
                              max={receivable.openAmount}
                              value={settlementAmounts[receivable.id] ?? ''}
                              onChange={(event) => handleSettlementAmountChange(receivable.id, event.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('buildingDeposits.movements.settlements.allocatedTotal', { total: settlementTotal.toLocaleString() })}
                  </p>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('buildingDeposits.movements.fields.amount')} htmlFor="buildingDepositMovementAmount">
              <Input
                id="buildingDepositMovementAmount"
                type="number"
                min={1}
                max={movementKind !== 1 ? buildingDeposit?.heldAmount : undefined}
                value={isSettled ? settlementTotal : amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={isSettled}
                required
              />
            </FormItem>
            <FormItem label={t('buildingDeposits.movements.fields.documentDate')} htmlFor="buildingDepositMovementDocumentDate">
              <Input
                id="buildingDepositMovementDocumentDate"
                type="date"
                value={documentDate}
                onChange={(event) => setDocumentDate(event.target.value)}
                required
              />
            </FormItem>
          </div>

          <FormItem label={t('buildingDeposits.movements.fields.description')} htmlFor="buildingDepositMovementDescription">
            <Input id="buildingDepositMovementDescription" value={description} onChange={(event) => setDescription(event.target.value)} />
          </FormItem>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('buildingDeposits.movements.saving') : t('buildingDeposits.movements.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
