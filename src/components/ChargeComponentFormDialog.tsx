import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { saveChargeComponent } from '../api/chargeComponentService';
import { searchCostCategories, searchFunds } from '../api/finReferenceDataService';
import { searchBuildings } from '../api/buildingService';
import {
  ChargeComponentError,
  type ChargeComponentErrorCode,
  type ChargeComponentFullInfo,
  type ChargeModelKind,
  type ChargePayerKind,
  type ChargeSplitMethod,
  type ChargeTargetKind,
} from '../types/chargeComponent';
import type { SpaceType } from '../types/buildingSpace';
import type { Building } from '../types/building';
import type { FinCostCategory, FinFund } from '../types/finReferenceData';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

const TARGET_KIND_OPTIONS: ChargeTargetKind[] = [1, 2];
const MODEL_KIND_OPTIONS: ChargeModelKind[] = [1, 2];
const SPLIT_METHOD_OPTIONS: ChargeSplitMethod[] = [1, 2, 3, 4, 5, 6];
const PAYER_KIND_OPTIONS: ChargePayerKind[] = [1, 2];
const SPACE_TYPE_OPTIONS: SpaceType[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 99];

interface ChargeComponentFormDialogProps {
  isOpen: boolean;
  chargePlanId: string;
  chargeComponent: ChargeComponentFullInfo | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ChargeComponentFormDialog({ isOpen, chargePlanId, chargeComponent, onClose, onSaved }: ChargeComponentFormDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [targetKind, setTargetKind] = useState<ChargeTargetKind>(1);
  const [spaceType, setSpaceType] = useState<SpaceType | ''>('');
  const [buildingId, setBuildingId] = useState('');
  const [modelKind, setModelKind] = useState<ChargeModelKind>(1);
  const [amount, setAmount] = useState('');
  const [splitMethod, setSplitMethod] = useState<ChargeSplitMethod>(2);
  const [payerKind, setPayerKind] = useState<ChargePayerKind>(1);
  const [costCategoryId, setCostCategoryId] = useState('');
  const [fundId, setFundId] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [sortOrder, setSortOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [costCategories, setCostCategories] = useState<FinCostCategory[]>([]);
  const [funds, setFunds] = useState<FinFund[]>([]);

  // ChargeComponent.CostCategoryId must be a leaf — a category used as another's parent is rejected by the backend (37227).
  const leafCostCategories = costCategories.filter(
    (category) => !costCategories.some((other) => other.parentCostCategoryId === category.id),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ChargeComponentErrorCode | null>(null);

  const isEdit = chargeComponent !== null;

  const reset = () => {
    setTitle(chargeComponent?.title ?? '');
    setTargetKind(chargeComponent?.targetKind ?? 1);
    setSpaceType(chargeComponent?.spaceType ?? '');
    setBuildingId(chargeComponent?.buildingId ?? '');
    setModelKind(chargeComponent?.modelKind ?? 1);
    setAmount(chargeComponent?.amount != null ? String(chargeComponent.amount) : '');
    setSplitMethod(chargeComponent?.splitMethod ?? 2);
    setPayerKind(chargeComponent?.payerKind ?? 1);
    setCostCategoryId(chargeComponent?.costCategoryId ?? '');
    setFundId(chargeComponent?.fundId ?? '');
    setValidFrom(chargeComponent?.validFrom?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
    setValidTo(chargeComponent?.validTo?.slice(0, 10) ?? '');
    setSortOrder(chargeComponent ? String(chargeComponent.sortOrder) : '1');
    setIsActive(chargeComponent?.isActive ?? true);
    setDescription(chargeComponent?.description ?? '');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      Promise.all([searchBuildings(), searchCostCategories(), searchFunds()]).then(([buildingsResult, categories, fundsResult]) => {
        setBuildings(buildingsResult);
        setCostCategories(categories);
        setFunds(fundsResult);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, chargeComponent]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: chargeComponent?.id ?? crypto.randomUUID(),
      chargePlanId,
      title,
      targetKind,
      spaceType: targetKind === 2 && spaceType !== '' ? spaceType : null,
      buildingId: buildingId || null,
      modelKind,
      amount: amount ? Number(amount) : null,
      splitMethod,
      payerKind,
      costCategoryId,
      fundId,
      validFrom,
      validTo: validTo || null,
      sortOrder: Number(sortOrder),
      isActive,
      description: description || null,
    };

    try {
      await saveChargeComponent(payload, isEdit);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ChargeComponentError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={760}>
      <h4 className="mb-4">{isEdit ? t('chargePlans.components.editTitle') : t('chargePlans.components.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`chargePlans.components.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('chargePlans.components.fields.title')} htmlFor="chargeComponentTitle">
              <Input id="chargeComponentTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </FormItem>
            <FormItem label={t('chargePlans.components.fields.targetKind')} htmlFor="chargeComponentTargetKind">
              <select
                id="chargeComponentTargetKind"
                className="input"
                value={targetKind}
                onChange={(event) => setTargetKind(Number(event.target.value) as ChargeTargetKind)}
              >
                {TARGET_KIND_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`chargePlans.components.targetKinds.${value}`)}
                  </option>
                ))}
              </select>
            </FormItem>
            {targetKind === 2 && (
              <FormItem label={t('chargePlans.components.fields.spaceType')} htmlFor="chargeComponentSpaceType">
                <select
                  id="chargeComponentSpaceType"
                  className="input"
                  value={spaceType}
                  onChange={(event) => setSpaceType(event.target.value ? (Number(event.target.value) as SpaceType) : '')}
                >
                  <option value="">—</option>
                  {SPACE_TYPE_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {t(`buildingSpaces.spaceTypes.${value}`)}
                    </option>
                  ))}
                </select>
              </FormItem>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('chargePlans.components.fields.building')} htmlFor="chargeComponentBuilding">
              <select id="chargeComponentBuilding" className="input" value={buildingId} onChange={(event) => setBuildingId(event.target.value)}>
                <option value="">{t('chargePlans.components.allBuildings')}</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.title}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('chargePlans.components.fields.modelKind')} htmlFor="chargeComponentModelKind">
              <select
                id="chargeComponentModelKind"
                className="input"
                value={modelKind}
                onChange={(event) => setModelKind(Number(event.target.value) as ChargeModelKind)}
              >
                {MODEL_KIND_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`chargePlans.components.modelKinds.${value}`)}
                  </option>
                ))}
              </select>
            </FormItem>
            {modelKind === 1 && (
              <FormItem label={t('chargePlans.components.fields.amount')} htmlFor="chargeComponentAmount">
                <Input id="chargeComponentAmount" type="number" min={1} value={amount} onChange={(event) => setAmount(event.target.value)} required />
              </FormItem>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('chargePlans.components.fields.splitMethod')} htmlFor="chargeComponentSplitMethod">
              <select
                id="chargeComponentSplitMethod"
                className="input"
                value={splitMethod}
                onChange={(event) => setSplitMethod(Number(event.target.value) as ChargeSplitMethod)}
              >
                {SPLIT_METHOD_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`chargePlans.components.splitMethods.${value}`)}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('chargePlans.components.fields.payerKind')} htmlFor="chargeComponentPayerKind">
              <select
                id="chargeComponentPayerKind"
                className="input"
                value={payerKind}
                onChange={(event) => setPayerKind(Number(event.target.value) as ChargePayerKind)}
              >
                {PAYER_KIND_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`chargePlans.components.payerKinds.${value}`)}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('chargePlans.components.fields.costCategory')} htmlFor="chargeComponentCostCategory">
              <select
                id="chargeComponentCostCategory"
                className="input"
                value={costCategoryId}
                onChange={(event) => setCostCategoryId(event.target.value)}
                required
              >
                <option value="">—</option>
                {leafCostCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('chargePlans.components.fields.fund')} htmlFor="chargeComponentFund">
              <select id="chargeComponentFund" className="input" value={fundId} onChange={(event) => setFundId(event.target.value)} required>
                <option value="">—</option>
                {funds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.title}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('chargePlans.components.fields.validFrom')} htmlFor="chargeComponentValidFrom">
              <Input id="chargeComponentValidFrom" type="date" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} required />
            </FormItem>
            <FormItem label={t('chargePlans.components.fields.validTo')} htmlFor="chargeComponentValidTo">
              <Input id="chargeComponentValidTo" type="date" value={validTo} onChange={(event) => setValidTo(event.target.value)} />
            </FormItem>
            <FormItem label={t('chargePlans.components.fields.sortOrder')} htmlFor="chargeComponentSortOrder">
              <Input id="chargeComponentSortOrder" type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
            </FormItem>
          </div>

          <FormItem label={t('chargePlans.components.fields.description')} htmlFor="chargeComponentDescription">
            <Input id="chargeComponentDescription" value={description} onChange={(event) => setDescription(event.target.value)} />
          </FormItem>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none mb-5">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="accent-primary" />
            {t('chargePlans.components.fields.isActive')}
          </label>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('chargePlans.saving') : t('chargePlans.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
