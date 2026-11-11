import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { deleteCheque, saveCheque, type ChequeGridRow } from '../api/chequeService';
import { searchAccountingEntities } from '../api/finReferenceDataService';
import { searchCashAccountsByEntity } from '../api/cashAccountService';
import { CHEQUE_ENDPOINTS } from '../api/config';
import { ChequeError, type Cheque, type ChequeDirection, type ChequeErrorCode } from '../types/cheque';
import type { CashAccount } from '../types/cashAccount';
import type { FinAccountingEntity } from '../types/finReferenceData';
import { Alert, Button, Card, Dialog, FormContainer, FormItem, Input } from '../components/ui';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GridView, type GridViewHandle } from '../components/GridView';
import { PartyPickerField } from '../components/PartyPickerField';

const CHEQUE_DIRECTIONS: ChequeDirection[] = [1, 2];

type ChequeWithPartyDisplay = Cheque & { partyDisplayName: string };

function mapChequeGridRow(row: ChequeGridRow): ChequeWithPartyDisplay {
  return {
    id: row.Id,
    accountingEntityId: row.AccountingEntityId,
    chequeDirection: row.ChequeDirection,
    partyId: row.PartyId,
    partyDisplayName: row.PartyDisplayName,
    chequeNumber: row.ChequeNumber,
    sayadId: null,
    bankName: row.BankName || null,
    cashAccountId: null,
    issueDate: null,
    dueDate: row.DueDate,
    amount: row.Amount,
    status: row.Status,
    description: null,
    depositedCashAccountId: null,
    endorsedToPartyId: null,
    clearedAmount: null,
  };
}

export function ChequesPage() {
  const { t } = useTranslation();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCheque, setEditingCheque] = useState<ChequeWithPartyDisplay | null>(null);
  const [deletingCheque, setDeletingCheque] = useState<Cheque | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const openAdd = () => {
    setEditingCheque(null);
    setIsFormOpen(true);
  };

  const openEdit = (row: ChequeGridRow) => {
    setEditingCheque(mapChequeGridRow(row));
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingCheque) return;
    setIsDeleting(true);
    try {
      await deleteCheque(deletingCheque.id);
      setDeletingCheque(null);
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
        <h1>{t('cheques.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('cheques.addButton')}
        </Button>
      </div>

      <GridView<ChequeGridRow>
        ref={gridRef}
        dataUrl={CHEQUE_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('cheques.empty')}
        columns={[
          {
            propertyName: 'ChequeNumber',
            header: t('cheques.fields.chequeNumber'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'ChequeDirection',
            header: t('cheques.fields.chequeDirection'),
            render: (row) => t(`cheques.directions.${row.ChequeDirection}`),
          },
          {
            propertyName: 'PartyDisplayName',
            header: t('cheques.fields.party'),
            filterOperator: 'like',
          },
          {
            propertyName: 'DueDate',
            header: t('cheques.fields.dueDate'),
            sortable: true,
          },
          {
            propertyName: 'Amount',
            header: t('cheques.fields.amount'),
            sortable: true,
            render: (row) => row.Amount.toLocaleString(),
          },
          {
            propertyName: 'Status',
            header: t('cheques.fields.status'),
            render: (row) => t(`cheques.chequeStatuses.${row.Status}`),
          },
        ]}
        actions={(row) =>
          row.Status === 1 ? (
            <>
              <Button variant="plain" size="xs" icon={<HiOutlinePencil />} onClick={() => openEdit(row)} />
              <Button
                variant="plain"
                size="xs"
                icon={<HiOutlineTrash />}
                onClick={() => setDeletingCheque(mapChequeGridRow(row))}
              />
            </>
          ) : null
        }
      />

      {hasError && (
        <Alert type="danger" className="mt-2">
          {t('cheques.errors.in-use')}
        </Alert>
      )}

      <ChequeFormDialog
        isOpen={isFormOpen}
        cheque={editingCheque}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => gridRef.current?.reload()}
      />

      <ConfirmDialog
        isOpen={!!deletingCheque}
        message={t('cheques.deleteConfirm', { title: deletingCheque?.chequeNumber })}
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingCheque(null)}
      />
    </Card>
  );
}

interface ChequeFormDialogProps {
  isOpen: boolean;
  cheque: ChequeWithPartyDisplay | null;
  onClose: () => void;
  onSaved: () => void;
}

function ChequeFormDialog({ isOpen, cheque, onClose, onSaved }: ChequeFormDialogProps) {
  const { t } = useTranslation();
  const [accountingEntityId, setAccountingEntityId] = useState('');
  const [chequeDirection, setChequeDirection] = useState<ChequeDirection>(1);
  const [partyId, setPartyId] = useState('');
  const [isChangingParty, setIsChangingParty] = useState(true);
  const [chequeNumber, setChequeNumber] = useState('');
  const [sayadId, setSayadId] = useState('');
  const [bankName, setBankName] = useState('');
  const [cashAccountId, setCashAccountId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const [accountingEntities, setAccountingEntities] = useState<FinAccountingEntity[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ChequeErrorCode | null>(null);

  const isEdit = cheque !== null;

  const reset = () => {
    setAccountingEntityId(cheque?.accountingEntityId ?? '');
    setChequeDirection(cheque?.chequeDirection ?? 1);
    setPartyId(cheque?.partyId ?? '');
    setChequeNumber(cheque?.chequeNumber ?? '');
    setSayadId(cheque?.sayadId ?? '');
    setBankName(cheque?.bankName ?? '');
    setCashAccountId(cheque?.cashAccountId ?? '');
    setIssueDate(cheque?.issueDate?.slice(0, 10) ?? '');
    setDueDate(cheque?.dueDate?.slice(0, 10) ?? '');
    setAmount(cheque ? String(cheque.amount) : '');
    setDescription(cheque?.description ?? '');
    setIsChangingParty(!cheque);
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      searchAccountingEntities().then(setAccountingEntities);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cheque]);

  useEffect(() => {
    setCashAccounts([]);
    if (accountingEntityId) {
      searchCashAccountsByEntity(accountingEntityId).then(setCashAccounts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountingEntityId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: cheque?.id ?? crypto.randomUUID(),
      accountingEntityId,
      chequeDirection,
      partyId,
      chequeNumber: chequeNumber.trim(),
      sayadId: sayadId.trim() || null,
      bankName: bankName.trim() || null,
      cashAccountId: chequeDirection === 2 ? cashAccountId || null : null,
      issueDate: issueDate || null,
      dueDate,
      amount: Number(amount),
      description: description.trim() || null,
    };

    try {
      await saveCheque(payload, isEdit);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ChequeError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={620}>
      <h4 className="mb-4">{isEdit ? t('cheques.editTitle') : t('cheques.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`cheques.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('cheques.fields.accountingEntity')} htmlFor="chequeAccountingEntity">
              <select
                id="chequeAccountingEntity"
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
            <FormItem label={t('cheques.fields.chequeDirection')} htmlFor="chequeDirection">
              <select
                id="chequeDirection"
                className="input"
                value={chequeDirection}
                onChange={(event) => setChequeDirection(Number(event.target.value) as ChequeDirection)}
                disabled={isEdit}
                required
              >
                {CHEQUE_DIRECTIONS.map((direction) => (
                  <option key={direction} value={direction}>
                    {t(`cheques.directions.${direction}`)}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          {isChangingParty ? (
            <PartyPickerField isOpen={isOpen} onResolved={setPartyId} />
          ) : (
            <FormItem label={t('cheques.fields.party')} htmlFor="chequePartyDisplay">
              <div className="flex items-center gap-3">
                <Input id="chequePartyDisplay" value={cheque?.partyDisplayName ?? ''} disabled />
                <Button type="button" size="sm" onClick={() => setIsChangingParty(true)}>
                  {t('cheques.changeParty')}
                </Button>
              </div>
            </FormItem>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('cheques.fields.chequeNumber')} htmlFor="chequeNumber">
              <Input id="chequeNumber" value={chequeNumber} onChange={(event) => setChequeNumber(event.target.value)} required />
            </FormItem>
            <FormItem label={t('cheques.fields.sayadId')} htmlFor="chequeSayadId">
              <Input id="chequeSayadId" value={sayadId} onChange={(event) => setSayadId(event.target.value)} />
            </FormItem>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('cheques.fields.bankName')} htmlFor="chequeBankName">
              <Input id="chequeBankName" value={bankName} onChange={(event) => setBankName(event.target.value)} />
            </FormItem>
            {chequeDirection === 2 && (
              <FormItem label={t('cheques.fields.cashAccount')} htmlFor="chequeCashAccount">
                <select
                  id="chequeCashAccount"
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
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('cheques.fields.issueDate')} htmlFor="chequeIssueDate">
              <Input id="chequeIssueDate" type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
            </FormItem>
            <FormItem label={t('cheques.fields.dueDate')} htmlFor="chequeDueDate">
              <Input id="chequeDueDate" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />
            </FormItem>
            <FormItem label={t('cheques.fields.amount')} htmlFor="chequeAmount">
              <Input id="chequeAmount" type="number" min={1} value={amount} onChange={(event) => setAmount(event.target.value)} required />
            </FormItem>
          </div>

          <FormItem label={t('cheques.fields.description')} htmlFor="chequeDescription">
            <Input id="chequeDescription" value={description} onChange={(event) => setDescription(event.target.value)} />
          </FormItem>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('cheques.saving') : t('cheques.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
