import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { deleteCashAccount, saveCashAccount, type CashAccountGridRow } from '../api/cashAccountService';
import { searchAccountingEntities } from '../api/finReferenceDataService';
import { CASH_ACCOUNT_ENDPOINTS } from '../api/config';
import { CashAccountError, type CashAccount, type CashAccountErrorCode, type CashAccountType } from '../types/cashAccount';
import type { FinAccountingEntity } from '../types/finReferenceData';
import { Alert, Button, Card, Dialog, FormContainer, FormItem, Input } from '../components/ui';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GridView, type GridViewHandle } from '../components/GridView';
import { PartyPickerField } from '../components/PartyPickerField';

const CASH_ACCOUNT_TYPES: CashAccountType[] = [1, 2, 3];

function mapCashAccountGridRow(row: CashAccountGridRow): CashAccount & { custodianPartyDisplayName: string | null } {
  return {
    id: row.Id,
    accountingEntityId: row.AccountingEntityId,
    cashAccountType: row.CashAccountType,
    title: row.Title,
    bankName: null,
    branchName: null,
    accountNumber: row.AccountNumber || null,
    sheba: null,
    cardNumber: null,
    custodianPartyId: row.CustodianPartyId || null,
    isActive: row.IsActive,
    description: null,
    custodianPartyDisplayName: row.CustodianPartyDisplayName || null,
  };
}

export function CashAccountsPage() {
  const { t } = useTranslation();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<(CashAccount & { custodianPartyDisplayName?: string | null }) | null>(null);
  const [editingIsUsed, setEditingIsUsed] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<CashAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const openAdd = () => {
    setEditingAccount(null);
    setEditingIsUsed(false);
    setIsFormOpen(true);
  };

  const openEdit = (row: CashAccountGridRow) => {
    setEditingAccount(mapCashAccountGridRow(row));
    setEditingIsUsed(row.IsUsedInJournal);
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingAccount) return;
    setIsDeleting(true);
    try {
      await deleteCashAccount(deletingAccount.id);
      setDeletingAccount(null);
      gridRef.current?.reload();
    } catch {
      setHasError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('cashAccounts.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('cashAccounts.addButton')}
        </Button>
      </div>

      <GridView<CashAccountGridRow>
        ref={gridRef}
        dataUrl={CASH_ACCOUNT_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('cashAccounts.empty')}
        columns={[
          {
            propertyName: 'Title',
            header: t('cashAccounts.fields.title'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'CashAccountType',
            header: t('cashAccounts.fields.cashAccountType'),
            render: (row) => t(`cashAccounts.types.${row.CashAccountType}`),
          },
          {
            propertyName: 'AccountNumber',
            header: t('cashAccounts.fields.accountNumberOrCustodian'),
            render: (row) => row.AccountNumber || row.CustodianPartyDisplayName || '—',
          },
          {
            propertyName: 'IsActive',
            header: t('cashAccounts.fields.isActive'),
            sortable: true,
            render: (row) => (row.IsActive ? t('persons.detail.yes') : t('persons.detail.no')),
          },
        ]}
        actions={(row) => (
          <>
            <Button variant="plain" size="xs" icon={<HiOutlinePencil />} onClick={() => openEdit(row)} />
            <Button
              variant="plain"
              size="xs"
              icon={<HiOutlineTrash />}
              onClick={() => setDeletingAccount(mapCashAccountGridRow(row))}
            />
          </>
        )}
      />

      {hasError && (
        <Alert type="danger" className="mt-2">
          {t('cashAccounts.errors.in-use')}
        </Alert>
      )}

      <CashAccountFormDialog
        isOpen={isFormOpen}
        cashAccount={editingAccount}
        isUsedInJournal={editingIsUsed}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => gridRef.current?.reload()}
      />

      <ConfirmDialog
        isOpen={!!deletingAccount}
        message={t('cashAccounts.deleteConfirm', { title: deletingAccount?.title })}
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingAccount(null)}
      />
    </Card>
  );
}

interface CashAccountFormDialogProps {
  isOpen: boolean;
  cashAccount: (CashAccount & { custodianPartyDisplayName?: string | null }) | null;
  isUsedInJournal: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function CashAccountFormDialog({ isOpen, cashAccount, isUsedInJournal, onClose, onSaved }: CashAccountFormDialogProps) {
  const { t } = useTranslation();
  const [accountingEntityId, setAccountingEntityId] = useState('');
  const [cashAccountType, setCashAccountType] = useState<CashAccountType>(1);
  const [title, setTitle] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [sheba, setSheba] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [custodianPartyId, setCustodianPartyId] = useState('');
  const [isChangingCustodian, setIsChangingCustodian] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');

  const [accountingEntities, setAccountingEntities] = useState<FinAccountingEntity[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<CashAccountErrorCode | null>(null);

  const isEdit = cashAccount !== null;

  const reset = () => {
    setAccountingEntityId(cashAccount?.accountingEntityId ?? '');
    setCashAccountType(cashAccount?.cashAccountType ?? 1);
    setTitle(cashAccount?.title ?? '');
    setBankName(cashAccount?.bankName ?? '');
    setBranchName(cashAccount?.branchName ?? '');
    setAccountNumber(cashAccount?.accountNumber ?? '');
    setSheba(cashAccount?.sheba ?? '');
    setCardNumber(cashAccount?.cardNumber ?? '');
    setCustodianPartyId(cashAccount?.custodianPartyId ?? '');
    setIsChangingCustodian(!cashAccount?.custodianPartyId);
    setIsActive(cashAccount?.isActive ?? true);
    setDescription(cashAccount?.description ?? '');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      searchAccountingEntities().then(setAccountingEntities);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cashAccount]);

  const handleTypeChange = (newType: CashAccountType) => {
    setCashAccountType(newType);
    if (newType !== 1) {
      setBankName('');
      setBranchName('');
      setAccountNumber('');
      setSheba('');
      setCardNumber('');
    } else {
      setCustodianPartyId('');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: cashAccount?.id ?? crypto.randomUUID(),
      accountingEntityId,
      cashAccountType,
      title,
      bankName: cashAccountType === 1 ? bankName || null : null,
      branchName: cashAccountType === 1 ? branchName || null : null,
      accountNumber: cashAccountType === 1 ? accountNumber || null : null,
      sheba: cashAccountType === 1 ? sheba || null : null,
      cardNumber: cashAccountType === 1 ? cardNumber || null : null,
      custodianPartyId: cashAccountType !== 1 ? custodianPartyId || null : null,
      isActive,
      description: description || null,
    };

    try {
      await saveCashAccount(payload, isEdit);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof CashAccountError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={620}>
      <h4 className="mb-4">{isEdit ? t('cashAccounts.editTitle') : t('cashAccounts.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`cashAccounts.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('cashAccounts.fields.accountingEntity')} htmlFor="cashAccountAccountingEntity">
              <select
                id="cashAccountAccountingEntity"
                className="input"
                value={accountingEntityId}
                onChange={(event) => setAccountingEntityId(event.target.value)}
                disabled={isEdit}
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
            <FormItem label={t('cashAccounts.fields.cashAccountType')} htmlFor="cashAccountType">
              <select
                id="cashAccountType"
                className="input"
                value={cashAccountType}
                onChange={(event) => handleTypeChange(Number(event.target.value) as CashAccountType)}
                disabled={isEdit && isUsedInJournal}
                required
              >
                {CASH_ACCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`cashAccounts.types.${type}`)}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          <FormItem label={t('cashAccounts.fields.title')} htmlFor="cashAccountTitle">
            <Input id="cashAccountTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </FormItem>

          {cashAccountType === 1 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormItem label={t('cashAccounts.fields.bankName')} htmlFor="cashAccountBankName">
                  <Input id="cashAccountBankName" value={bankName} onChange={(event) => setBankName(event.target.value)} />
                </FormItem>
                <FormItem label={t('cashAccounts.fields.branchName')} htmlFor="cashAccountBranchName">
                  <Input id="cashAccountBranchName" value={branchName} onChange={(event) => setBranchName(event.target.value)} />
                </FormItem>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormItem label={t('cashAccounts.fields.accountNumber')} htmlFor="cashAccountNumber">
                  <Input id="cashAccountNumber" value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} />
                </FormItem>
                <FormItem label={t('cashAccounts.fields.sheba')} htmlFor="cashAccountSheba">
                  <Input id="cashAccountSheba" value={sheba} onChange={(event) => setSheba(event.target.value)} placeholder="IR..." />
                </FormItem>
                <FormItem label={t('cashAccounts.fields.cardNumber')} htmlFor="cashAccountCardNumber">
                  <Input id="cashAccountCardNumber" value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} />
                </FormItem>
              </div>
            </>
          ) : isChangingCustodian ? (
            <PartyPickerField isOpen={isOpen} onResolved={setCustodianPartyId} />
          ) : (
            <FormItem label={t('cashAccounts.fields.custodian')} htmlFor="cashAccountCustodianDisplay">
              <div className="flex items-center gap-3">
                <Input id="cashAccountCustodianDisplay" value={cashAccount?.custodianPartyDisplayName ?? ''} disabled />
                <Button type="button" size="sm" onClick={() => setIsChangingCustodian(true)}>
                  {t('cashAccounts.changeCustodian')}
                </Button>
              </div>
            </FormItem>
          )}

          <FormItem label={t('cashAccounts.fields.description')} htmlFor="cashAccountDescription">
            <Input
              id="cashAccountDescription"
              textArea
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormItem>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none mb-5">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="accent-primary" />
            {t('cashAccounts.fields.isActive')}
          </label>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('cashAccounts.saving') : t('cashAccounts.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
