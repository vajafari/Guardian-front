import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import {
  deleteServiceBillingType,
  saveServiceBillingType,
  type ServiceBillingTypeGridRow,
} from '../api/serviceBillingTypeService';
import { searchAccountingEntities, searchCostCategories, searchFunds } from '../api/finReferenceDataService';
import { SERVICE_BILLING_TYPE_ENDPOINTS } from '../api/config';
import {
  ServiceBillingTypeError,
  type ServiceBillingType,
  type ServiceBillingTypeErrorCode,
} from '../types/serviceBillingType';
import type { FinAccountingEntity, FinCostCategory, FinFund } from '../types/finReferenceData';
import { Alert, Button, Card, Dialog, FormContainer, FormItem, Input } from '../components/ui';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

function mapServiceBillingTypeGridRow(row: ServiceBillingTypeGridRow): ServiceBillingType {
  return {
    id: row.Id,
    accountingEntityId: row.AccountingEntityId,
    title: row.Title,
    defaultAmount: row.DefaultAmount,
    fundId: row.FundId,
    costCategoryId: row.CostCategoryId || null,
    isActive: row.IsActive,
    description: null,
  };
}

export function ServiceBillingTypesPage() {
  const { t } = useTranslation();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<ServiceBillingType | null>(null);
  const [deletingType, setDeletingType] = useState<ServiceBillingType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const openAdd = () => {
    setEditingType(null);
    setIsFormOpen(true);
  };

  const openEdit = (row: ServiceBillingTypeGridRow) => {
    setEditingType(mapServiceBillingTypeGridRow(row));
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingType) return;
    setIsDeleting(true);
    try {
      await deleteServiceBillingType(deletingType.id);
      setDeletingType(null);
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
        <h1>{t('serviceBillingTypes.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('serviceBillingTypes.addButton')}
        </Button>
      </div>

      <GridView<ServiceBillingTypeGridRow>
        ref={gridRef}
        dataUrl={SERVICE_BILLING_TYPE_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('serviceBillingTypes.empty')}
        columns={[
          {
            propertyName: 'Title',
            header: t('serviceBillingTypes.fields.title'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'DefaultAmount',
            header: t('serviceBillingTypes.fields.defaultAmount'),
            render: (row) => (row.DefaultAmount != null ? row.DefaultAmount.toLocaleString() : '—'),
          },
          {
            propertyName: 'FundTitle',
            header: t('serviceBillingTypes.fields.fund'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'IsActive',
            header: t('serviceBillingTypes.fields.isActive'),
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
              onClick={() => setDeletingType(mapServiceBillingTypeGridRow(row))}
            />
          </>
        )}
      />

      {hasError && (
        <Alert type="danger" className="mt-2">
          {t('serviceBillingTypes.loadError')}
        </Alert>
      )}

      <ServiceBillingTypeFormDialog
        isOpen={isFormOpen}
        serviceBillingType={editingType}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => gridRef.current?.reload()}
      />

      <ConfirmDialog
        isOpen={!!deletingType}
        message={t('serviceBillingTypes.deleteConfirm', { title: deletingType?.title })}
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingType(null)}
      />
    </Card>
  );
}

interface ServiceBillingTypeFormDialogProps {
  isOpen: boolean;
  serviceBillingType: ServiceBillingType | null;
  onClose: () => void;
  onSaved: () => void;
}

function ServiceBillingTypeFormDialog({ isOpen, serviceBillingType, onClose, onSaved }: ServiceBillingTypeFormDialogProps) {
  const { t } = useTranslation();
  const [accountingEntityId, setAccountingEntityId] = useState('');
  const [title, setTitle] = useState('');
  const [defaultAmount, setDefaultAmount] = useState('');
  const [fundId, setFundId] = useState('');
  const [costCategoryId, setCostCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');

  const [accountingEntities, setAccountingEntities] = useState<FinAccountingEntity[]>([]);
  const [funds, setFunds] = useState<FinFund[]>([]);
  const [costCategories, setCostCategories] = useState<FinCostCategory[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ServiceBillingTypeErrorCode | null>(null);

  const isEdit = serviceBillingType !== null;

  // CostCategoryId must be a leaf — a category used as another's parent is rejected by the backend (37227).
  const leafCostCategories = costCategories.filter(
    (category) => !costCategories.some((other) => other.parentCostCategoryId === category.id),
  );

  const reset = () => {
    setAccountingEntityId(serviceBillingType?.accountingEntityId ?? '');
    setTitle(serviceBillingType?.title ?? '');
    setDefaultAmount(serviceBillingType?.defaultAmount != null ? String(serviceBillingType.defaultAmount) : '');
    setFundId(serviceBillingType?.fundId ?? '');
    setCostCategoryId(serviceBillingType?.costCategoryId ?? '');
    setIsActive(serviceBillingType?.isActive ?? true);
    setDescription(serviceBillingType?.description ?? '');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      Promise.all([searchAccountingEntities(), searchFunds(), searchCostCategories()]).then(([entities, fundsResult, categories]) => {
        setAccountingEntities(entities);
        setFunds(fundsResult);
        setCostCategories(categories);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, serviceBillingType]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: serviceBillingType?.id ?? crypto.randomUUID(),
      accountingEntityId,
      title,
      defaultAmount: defaultAmount ? Number(defaultAmount) : null,
      fundId,
      costCategoryId: costCategoryId || null,
      isActive,
      description: description || null,
    };

    try {
      await saveServiceBillingType(payload, isEdit);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ServiceBillingTypeError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={560}>
      <h4 className="mb-4">{isEdit ? t('serviceBillingTypes.editTitle') : t('serviceBillingTypes.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`serviceBillingTypes.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('serviceBillingTypes.fields.accountingEntity')} htmlFor="serviceBillingTypeAccountingEntity">
            <select
              id="serviceBillingTypeAccountingEntity"
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

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('serviceBillingTypes.fields.title')} htmlFor="serviceBillingTypeTitle">
              <Input id="serviceBillingTypeTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </FormItem>
            <FormItem label={t('serviceBillingTypes.fields.defaultAmount')} htmlFor="serviceBillingTypeDefaultAmount">
              <Input
                id="serviceBillingTypeDefaultAmount"
                type="number"
                min={0}
                value={defaultAmount}
                onChange={(event) => setDefaultAmount(event.target.value)}
              />
            </FormItem>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('serviceBillingTypes.fields.fund')} htmlFor="serviceBillingTypeFund">
              <select id="serviceBillingTypeFund" className="input" value={fundId} onChange={(event) => setFundId(event.target.value)} required>
                <option value="">—</option>
                {funds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.title}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('serviceBillingTypes.fields.costCategory')} htmlFor="serviceBillingTypeCostCategory">
              <select
                id="serviceBillingTypeCostCategory"
                className="input"
                value={costCategoryId}
                onChange={(event) => setCostCategoryId(event.target.value)}
              >
                <option value="">—</option>
                {leafCostCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          <FormItem label={t('serviceBillingTypes.fields.description')} htmlFor="serviceBillingTypeDescription">
            <Input
              id="serviceBillingTypeDescription"
              textArea
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormItem>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none mb-5">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="accent-primary" />
            {t('serviceBillingTypes.fields.isActive')}
          </label>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('serviceBillingTypes.saving') : t('serviceBillingTypes.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
