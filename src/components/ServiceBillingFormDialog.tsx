import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addServiceBilling } from '../api/serviceBillingService';
import { searchServiceBillingTypesByEntity } from '../api/serviceBillingTypeService';
import { searchAccountingEntities, searchAccountingEntityBuildings, searchCostCategories, searchFunds } from '../api/finReferenceDataService';
import { searchBuildingUnitsByBuilding } from '../api/buildingUnitService';
import { searchBuildingSpaces } from '../api/buildingSpaceService';
import { ServiceBillingError, type ServiceBillingErrorCode, type ServiceBillingRequestPayload } from '../types/serviceBilling';
import type { ServiceBillingType } from '../types/serviceBillingType';
import type { FinAccountingEntity, FinAccountingEntityBuilding, FinCostCategory, FinFund } from '../types/finReferenceData';
import type { BuildingUnit } from '../types/buildingUnit';
import type { BuildingSpace } from '../types/buildingSpace';
import { PartyPickerField } from './PartyPickerField';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

type TargetType = 'unit' | 'space';

interface ServiceBillingFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ServiceBillingFormDialog({ isOpen, onClose, onSaved }: ServiceBillingFormDialogProps) {
  const { t } = useTranslation();
  const [accountingEntityId, setAccountingEntityId] = useState('');
  const [serviceBillingTypeId, setServiceBillingTypeId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('unit');
  const [buildingUnitId, setBuildingUnitId] = useState('');
  const [buildingSpaceId, setBuildingSpaceId] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [fundId, setFundId] = useState('');
  const [costCategoryId, setCostCategoryId] = useState('');
  const [description, setDescription] = useState('');

  const [accountingEntities, setAccountingEntities] = useState<FinAccountingEntity[]>([]);
  const [serviceBillingTypes, setServiceBillingTypes] = useState<ServiceBillingType[]>([]);
  const [buildings, setBuildings] = useState<FinAccountingEntityBuilding[]>([]);
  const [units, setUnits] = useState<BuildingUnit[]>([]);
  const [spaces, setSpaces] = useState<BuildingSpace[]>([]);
  const [funds, setFunds] = useState<FinFund[]>([]);
  const [costCategories, setCostCategories] = useState<FinCostCategory[]>([]);

  const leafCostCategories = costCategories.filter(
    (category) => !costCategories.some((other) => other.parentCostCategoryId === category.id),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ServiceBillingErrorCode | null>(null);

  const reset = () => {
    setAccountingEntityId('');
    setServiceBillingTypeId('');
    setPartyId('');
    setBuildingId('');
    setTargetType('unit');
    setBuildingUnitId('');
    setBuildingSpaceId('');
    setTitle('');
    setAmount('');
    setDocumentDate(new Date().toISOString().slice(0, 10));
    setDueDate('');
    setFundId('');
    setCostCategoryId('');
    setDescription('');
    setServiceBillingTypes([]);
    setBuildings([]);
    setUnits([]);
    setSpaces([]);
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
    setServiceBillingTypeId('');
    setServiceBillingTypes([]);
    setBuildingId('');
    setBuildings([]);
    setUnits([]);
    setSpaces([]);
    setBuildingUnitId('');
    setBuildingSpaceId('');
    if (accountingEntityId) {
      searchServiceBillingTypesByEntity(accountingEntityId).then(setServiceBillingTypes);
      searchAccountingEntityBuildings(accountingEntityId).then(setBuildings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountingEntityId]);

  const handleServiceBillingTypeChange = (newTypeId: string) => {
    setServiceBillingTypeId(newTypeId);
    const type = serviceBillingTypes.find((candidate) => candidate.id === newTypeId);
    if (type) {
      setTitle(type.title);
      setAmount(type.defaultAmount != null ? String(type.defaultAmount) : '');
      setFundId(type.fundId);
      setCostCategoryId(type.costCategoryId ?? '');
    }
  };

  const loadBuildingScopedData = async (id: string) => {
    if (!id) {
      setUnits([]);
      setSpaces([]);
      return;
    }
    const [buildingUnits, buildingSpaces] = await Promise.all([
      searchBuildingUnitsByBuilding(id),
      searchBuildingSpaces({ buildingIds: [id], spaceNatures: [1] }),
    ]);
    setUnits(buildingUnits);
    setSpaces(buildingSpaces);
  };

  const handleBuildingChange = (newBuildingId: string) => {
    setBuildingId(newBuildingId);
    setBuildingUnitId('');
    setBuildingSpaceId('');
    loadBuildingScopedData(newBuildingId);
  };

  const handleTargetTypeChange = (newTargetType: TargetType) => {
    setTargetType(newTargetType);
    setBuildingUnitId('');
    setBuildingSpaceId('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!partyId) {
      setError('party-not-found');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const payload: ServiceBillingRequestPayload = {
      accountingEntityId,
      documentDate,
      serviceBillingTypeId,
      partyId,
      amount: Number(amount),
      buildingUnitId: targetType === 'unit' ? buildingUnitId : null,
      buildingSpaceId: targetType === 'space' ? buildingSpaceId : null,
      title: title.trim() || null,
      dueDate: dueDate || null,
      fundId: fundId || null,
      costCategoryId: costCategoryId || null,
      description: description.trim() || null,
    };

    try {
      await addServiceBilling(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ServiceBillingError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={680}>
      <h4 className="mb-4">{t('serviceBillings.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`serviceBillings.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('serviceBillings.fields.accountingEntity')} htmlFor="serviceBillingAccountingEntity">
              <select
                id="serviceBillingAccountingEntity"
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
            <FormItem label={t('serviceBillings.fields.serviceBillingType')} htmlFor="serviceBillingType">
              <select
                id="serviceBillingType"
                className="input"
                value={serviceBillingTypeId}
                onChange={(event) => handleServiceBillingTypeChange(event.target.value)}
                disabled={!accountingEntityId}
                required
              >
                <option value="">—</option>
                {serviceBillingTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.title}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          <PartyPickerField isOpen={isOpen} onResolved={setPartyId} />

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('serviceBillings.fields.building')} htmlFor="serviceBillingBuilding">
              <select
                id="serviceBillingBuilding"
                className="input"
                value={buildingId}
                onChange={(event) => handleBuildingChange(event.target.value)}
                disabled={!accountingEntityId}
                required
              >
                <option value="">—</option>
                {buildings.map((building) => (
                  <option key={building.buildingId} value={building.buildingId}>
                    {building.buildingTitle}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('serviceBillings.fields.targetType')} htmlFor="serviceBillingTargetType">
              <div className="flex items-center gap-4 h-full">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="serviceBillingTargetType"
                    checked={targetType === 'unit'}
                    onChange={() => handleTargetTypeChange('unit')}
                  />
                  {t('serviceBillings.targetTypes.unit')}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="serviceBillingTargetType"
                    checked={targetType === 'space'}
                    onChange={() => handleTargetTypeChange('space')}
                  />
                  {t('serviceBillings.targetTypes.space')}
                </label>
              </div>
            </FormItem>
          </div>

          {targetType === 'unit' ? (
            <FormItem label={t('serviceBillings.fields.buildingUnit')} htmlFor="serviceBillingUnit">
              <select id="serviceBillingUnit" className="input" value={buildingUnitId} onChange={(event) => setBuildingUnitId(event.target.value)} required>
                <option value="">—</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.title}
                  </option>
                ))}
              </select>
            </FormItem>
          ) : (
            <FormItem label={t('serviceBillings.fields.buildingSpace')} htmlFor="serviceBillingSpace">
              <select id="serviceBillingSpace" className="input" value={buildingSpaceId} onChange={(event) => setBuildingSpaceId(event.target.value)} required>
                <option value="">—</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.spaceNumber}
                  </option>
                ))}
              </select>
            </FormItem>
          )}

          <FormItem label={t('serviceBillings.fields.title')} htmlFor="serviceBillingTitle">
            <Input id="serviceBillingTitle" value={title} onChange={(event) => setTitle(event.target.value)} />
          </FormItem>

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('serviceBillings.fields.amount')} htmlFor="serviceBillingAmount">
              <Input id="serviceBillingAmount" type="number" min={1} value={amount} onChange={(event) => setAmount(event.target.value)} required />
            </FormItem>
            <FormItem label={t('serviceBillings.fields.documentDate')} htmlFor="serviceBillingDocumentDate">
              <Input
                id="serviceBillingDocumentDate"
                type="date"
                value={documentDate}
                onChange={(event) => setDocumentDate(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('serviceBillings.fields.dueDate')} htmlFor="serviceBillingDueDate">
              <Input id="serviceBillingDueDate" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </FormItem>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('serviceBillings.fields.fund')} htmlFor="serviceBillingFund">
              <select id="serviceBillingFund" className="input" value={fundId} onChange={(event) => setFundId(event.target.value)}>
                <option value="">—</option>
                {funds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.title}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('serviceBillings.fields.costCategory')} htmlFor="serviceBillingCostCategory">
              <select id="serviceBillingCostCategory" className="input" value={costCategoryId} onChange={(event) => setCostCategoryId(event.target.value)}>
                <option value="">—</option>
                {leafCostCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          <FormItem label={t('serviceBillings.fields.description')} htmlFor="serviceBillingDescription">
            <Input id="serviceBillingDescription" value={description} onChange={(event) => setDescription(event.target.value)} />
          </FormItem>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('serviceBillings.saving') : t('serviceBillings.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
