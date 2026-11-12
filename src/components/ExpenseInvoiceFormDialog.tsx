import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineTrash } from 'react-icons/hi';
import { addExpenseInvoice } from '../api/expenseInvoiceService';
import { searchAccountingEntities, searchAccountingEntityBuildings, searchCostCategories, searchFunds } from '../api/finReferenceDataService';
import { searchCashAccountsByEntity } from '../api/cashAccountService';
import { searchBuildingSpaces } from '../api/buildingSpaceService';
import { ExpenseInvoiceError, type ExpenseInvoiceErrorCode, type ExpenseInvoiceItemPayload } from '../types/expenseInvoice';
import type { CashAccount } from '../types/cashAccount';
import type { FinAccountingEntity, FinAccountingEntityBuilding, FinCostCategory, FinFund } from '../types/finReferenceData';
import type { BuildingSpace } from '../types/buildingSpace';
import { PartyPickerField } from './PartyPickerField';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface ItemRow extends ExpenseInvoiceItemPayload {
  id: string;
}

function createEmptyItemRow(): ItemRow {
  return { id: crypto.randomUUID(), description: null, costCategoryId: '', fundId: '', buildingSpaceId: null, amount: 0 };
}

interface ExpenseInvoiceFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ExpenseInvoiceFormDialog({ isOpen, onClose, onSaved }: ExpenseInvoiceFormDialogProps) {
  const { t } = useTranslation();
  const [accountingEntityId, setAccountingEntityId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [partyInvoiceNumber, setPartyInvoiceNumber] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [items, setItems] = useState<ItemRow[]>([createEmptyItemRow()]);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentCashAccountId, setPaymentCashAccountId] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [description, setDescription] = useState('');

  const [accountingEntities, setAccountingEntities] = useState<FinAccountingEntity[]>([]);
  const [buildings, setBuildings] = useState<FinAccountingEntityBuilding[]>([]);
  const [spaces, setSpaces] = useState<BuildingSpace[]>([]);
  const [funds, setFunds] = useState<FinFund[]>([]);
  const [costCategories, setCostCategories] = useState<FinCostCategory[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);

  const leafCostCategories = costCategories.filter(
    (category) => !costCategories.some((other) => other.parentCostCategoryId === category.id),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ExpenseInvoiceErrorCode | null>(null);

  const reset = () => {
    setAccountingEntityId('');
    setPartyId('');
    setPartyInvoiceNumber('');
    setBuildingId('');
    setItems([createEmptyItemRow()]);
    setPaidAmount('');
    setPaymentCashAccountId('');
    setDocumentDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setBuildings([]);
    setSpaces([]);
    setCashAccounts([]);
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      Promise.all([searchAccountingEntities(), searchFunds(), searchCostCategories()]).then(
        ([accountingEntitiesResult, fundsResult, costCategoriesResult]) => {
          setAccountingEntities(accountingEntitiesResult);
          setFunds(fundsResult);
          setCostCategories(costCategoriesResult);
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    setBuildingId('');
    setBuildings([]);
    setSpaces([]);
    setPaymentCashAccountId('');
    setCashAccounts([]);
    if (accountingEntityId) {
      searchAccountingEntityBuildings(accountingEntityId).then(setBuildings);
      searchCashAccountsByEntity(accountingEntityId).then(setCashAccounts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountingEntityId]);

  const handleBuildingChange = (newBuildingId: string) => {
    setBuildingId(newBuildingId);
    setItems((rows) => rows.map((row) => ({ ...row, buildingSpaceId: null })));
    if (!newBuildingId) {
      setSpaces([]);
      return;
    }
    searchBuildingSpaces({ buildingIds: [newBuildingId] }).then(setSpaces);
  };

  const updateItemRow = (id: string, patch: Partial<ItemRow>) => {
    setItems((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addItemRow = () => setItems((rows) => [...rows, createEmptyItemRow()]);
  const removeItemRow = (id: string) => setItems((rows) => rows.filter((row) => row.id !== id));
  const totalAmount = items.reduce((sum, row) => sum + (row.amount || 0), 0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      accountingEntityId,
      documentDate,
      partyId,
      partyInvoiceNumber: partyInvoiceNumber.trim() || null,
      buildingId: buildingId || null,
      paidAmount: Number(paidAmount) || 0,
      paymentCashAccountId: Number(paidAmount) > 0 ? paymentCashAccountId : null,
      description: description.trim() || null,
      items: items.map((row) => ({
        description: row.description,
        costCategoryId: row.costCategoryId,
        fundId: row.fundId,
        buildingSpaceId: row.buildingSpaceId,
        amount: row.amount,
      })),
    };

    try {
      await addExpenseInvoice(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ExpenseInvoiceError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={800}>
      <h4 className="mb-4">{t('expenseInvoices.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`expenseInvoices.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('expenseInvoices.fields.accountingEntity')} htmlFor="expenseInvoiceAccountingEntity">
              <select
                id="expenseInvoiceAccountingEntity"
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
            <FormItem label={t('expenseInvoices.fields.partyInvoiceNumber')} htmlFor="expenseInvoicePartyInvoiceNumber">
              <Input
                id="expenseInvoicePartyInvoiceNumber"
                value={partyInvoiceNumber}
                onChange={(event) => setPartyInvoiceNumber(event.target.value)}
              />
            </FormItem>
          </div>

          <PartyPickerField isOpen={isOpen} onResolved={setPartyId} />

          <FormItem label={t('expenseInvoices.fields.building')} htmlFor="expenseInvoiceBuilding">
            <select
              id="expenseInvoiceBuilding"
              className="input"
              value={buildingId}
              onChange={(event) => handleBuildingChange(event.target.value)}
              disabled={!accountingEntityId}
            >
              <option value="">—</option>
              {buildings.map((building) => (
                <option key={building.buildingId} value={building.buildingId}>
                  {building.buildingTitle}
                </option>
              ))}
            </select>
          </FormItem>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4">
            <h5 className="mb-2">{t('expenseInvoices.items.title')}</h5>
            <table className="w-full text-sm mb-2">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                  <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                    {t('expenseInvoices.items.description')}
                  </th>
                  <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                    {t('expenseInvoices.items.costCategory')}
                  </th>
                  <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                    {t('expenseInvoices.items.fund')}
                  </th>
                  <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                    {t('expenseInvoices.items.buildingSpace')}
                  </th>
                  <th className="py-1 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                    {t('expenseInvoices.items.amount')}
                  </th>
                  <th className="py-1 px-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <td className="py-1 px-2">
                      <Input
                        value={row.description ?? ''}
                        onChange={(event) => updateItemRow(row.id, { description: event.target.value || null })}
                      />
                    </td>
                    <td className="py-1 px-2">
                      <select
                        className="input"
                        value={row.costCategoryId}
                        onChange={(event) => updateItemRow(row.id, { costCategoryId: event.target.value })}
                      >
                        <option value="">—</option>
                        {leafCostCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.title}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1 px-2">
                      <select className="input" value={row.fundId} onChange={(event) => updateItemRow(row.id, { fundId: event.target.value })}>
                        <option value="">—</option>
                        {funds.map((fund) => (
                          <option key={fund.id} value={fund.id}>
                            {fund.title}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1 px-2">
                      <select
                        className="input"
                        value={row.buildingSpaceId ?? ''}
                        onChange={(event) => updateItemRow(row.id, { buildingSpaceId: event.target.value || null })}
                        disabled={!buildingId}
                      >
                        <option value="">—</option>
                        {spaces.map((space) => (
                          <option key={space.id} value={space.id}>
                            {space.spaceNumber}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1 px-2">
                      <Input
                        type="number"
                        min={1}
                        value={row.amount || ''}
                        onChange={(event) => updateItemRow(row.id, { amount: Number(event.target.value) })}
                      />
                    </td>
                    <td className="py-1 px-2">
                      {items.length > 1 && (
                        <Button type="button" variant="plain" size="xs" icon={<HiOutlineTrash />} onClick={() => removeItemRow(row.id)} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between">
              <Button type="button" size="sm" onClick={addItemRow}>
                {t('expenseInvoices.items.addLine')}
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('expenseInvoices.items.total', { total: totalAmount.toLocaleString() })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('expenseInvoices.fields.paidAmount')} htmlFor="expenseInvoicePaidAmount">
              <Input
                id="expenseInvoicePaidAmount"
                type="number"
                min={0}
                max={totalAmount}
                value={paidAmount}
                onChange={(event) => setPaidAmount(event.target.value)}
              />
            </FormItem>
            {Number(paidAmount) > 0 && (
              <FormItem label={t('expenseInvoices.fields.paymentCashAccount')} htmlFor="expenseInvoicePaymentCashAccount">
                <select
                  id="expenseInvoicePaymentCashAccount"
                  className="input"
                  value={paymentCashAccountId}
                  onChange={(event) => setPaymentCashAccountId(event.target.value)}
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('expenseInvoices.fields.documentDate')} htmlFor="expenseInvoiceDocumentDate">
              <Input
                id="expenseInvoiceDocumentDate"
                type="date"
                value={documentDate}
                onChange={(event) => setDocumentDate(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('expenseInvoices.fields.description')} htmlFor="expenseInvoiceDescription">
              <Input id="expenseInvoiceDescription" value={description} onChange={(event) => setDescription(event.target.value)} />
            </FormItem>
          </div>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('expenseInvoices.saving') : t('expenseInvoices.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
