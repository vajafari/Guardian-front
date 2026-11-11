import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { saveChargeDiscount } from '../api/chargeDiscountService';
import { searchAccountingEntityBuildings } from '../api/finReferenceDataService';
import { searchBuildingUnitsByBuilding } from '../api/buildingUnitService';
import { searchBuildingSpaces } from '../api/buildingSpaceService';
import { ChargeDiscountError, type ChargeDiscount, type ChargeDiscountErrorCode } from '../types/chargeDiscount';
import type { FinAccountingEntityBuilding } from '../types/finReferenceData';
import type { BuildingUnit } from '../types/buildingUnit';
import type { BuildingSpace } from '../types/buildingSpace';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

type TargetType = 'unit' | 'space';

interface ChargeDiscountFormDialogProps {
  isOpen: boolean;
  chargePlanId: string;
  accountingEntityId: string;
  chargeDiscount: ChargeDiscount | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ChargeDiscountFormDialog({
  isOpen,
  chargePlanId,
  accountingEntityId,
  chargeDiscount,
  onClose,
  onSaved,
}: ChargeDiscountFormDialogProps) {
  const { t } = useTranslation();
  const [buildingId, setBuildingId] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('unit');
  const [buildingUnitId, setBuildingUnitId] = useState('');
  const [buildingSpaceId, setBuildingSpaceId] = useState('');
  const [coefficient, setCoefficient] = useState('0.8');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [reason, setReason] = useState('');

  const [buildings, setBuildings] = useState<FinAccountingEntityBuilding[]>([]);
  const [units, setUnits] = useState<BuildingUnit[]>([]);
  const [spaces, setSpaces] = useState<BuildingSpace[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ChargeDiscountErrorCode | null>(null);

  const isEdit = chargeDiscount !== null;

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

  const reset = () => {
    setBuildingId('');
    setTargetType('unit');
    setBuildingUnitId(chargeDiscount?.buildingUnitId ?? '');
    setBuildingSpaceId(chargeDiscount?.buildingSpaceId ?? '');
    if (chargeDiscount?.buildingSpaceId) {
      setTargetType('space');
    }
    setCoefficient(chargeDiscount ? String(chargeDiscount.coefficient) : '0.8');
    setValidFrom(chargeDiscount?.validFrom?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
    setValidTo(chargeDiscount?.validTo?.slice(0, 10) ?? '');
    setReason(chargeDiscount?.reason ?? '');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      searchAccountingEntityBuildings(accountingEntityId).then(setBuildings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, chargeDiscount]);

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
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: chargeDiscount?.id ?? crypto.randomUUID(),
      chargePlanId,
      buildingUnitId: targetType === 'unit' ? buildingUnitId : null,
      buildingSpaceId: targetType === 'space' ? buildingSpaceId : null,
      coefficient: Number(coefficient),
      validFrom,
      validTo: validTo || null,
      reason,
    };

    try {
      await saveChargeDiscount(payload, isEdit);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ChargeDiscountError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={620}>
      <h4 className="mb-4">{isEdit ? t('chargePlans.discounts.editTitle') : t('chargePlans.discounts.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`chargePlans.discounts.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('chargePlans.discounts.fields.building')} htmlFor="chargeDiscountBuilding">
              <select
                id="chargeDiscountBuilding"
                className="input"
                value={buildingId}
                onChange={(event) => handleBuildingChange(event.target.value)}
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
            <FormItem label={t('chargePlans.discounts.fields.targetType')} htmlFor="chargeDiscountTargetType">
              <div className="flex items-center gap-4 h-full">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="chargeDiscountTargetType"
                    checked={targetType === 'unit'}
                    onChange={() => handleTargetTypeChange('unit')}
                  />
                  {t('chargePlans.discounts.targetTypes.unit')}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="chargeDiscountTargetType"
                    checked={targetType === 'space'}
                    onChange={() => handleTargetTypeChange('space')}
                  />
                  {t('chargePlans.discounts.targetTypes.space')}
                </label>
              </div>
            </FormItem>
          </div>

          {targetType === 'unit' ? (
            <FormItem label={t('chargePlans.discounts.fields.buildingUnit')} htmlFor="chargeDiscountUnit">
              <select id="chargeDiscountUnit" className="input" value={buildingUnitId} onChange={(event) => setBuildingUnitId(event.target.value)} required>
                <option value="">—</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.title}
                  </option>
                ))}
              </select>
            </FormItem>
          ) : (
            <FormItem label={t('chargePlans.discounts.fields.buildingSpace')} htmlFor="chargeDiscountSpace">
              <select id="chargeDiscountSpace" className="input" value={buildingSpaceId} onChange={(event) => setBuildingSpaceId(event.target.value)} required>
                <option value="">—</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.spaceNumber}
                  </option>
                ))}
              </select>
            </FormItem>
          )}

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('chargePlans.discounts.fields.coefficient')} htmlFor="chargeDiscountCoefficient">
              <Input
                id="chargeDiscountCoefficient"
                type="number"
                min={0}
                max={1}
                step="any"
                value={coefficient}
                onChange={(event) => setCoefficient(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('chargePlans.discounts.fields.validFrom')} htmlFor="chargeDiscountValidFrom">
              <Input id="chargeDiscountValidFrom" type="date" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} required />
            </FormItem>
            <FormItem label={t('chargePlans.discounts.fields.validTo')} htmlFor="chargeDiscountValidTo">
              <Input id="chargeDiscountValidTo" type="date" value={validTo} onChange={(event) => setValidTo(event.target.value)} />
            </FormItem>
          </div>

          <FormItem label={t('chargePlans.discounts.fields.reason')} htmlFor="chargeDiscountReason">
            <Input id="chargeDiscountReason" value={reason} onChange={(event) => setReason(event.target.value)} required />
          </FormItem>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('chargePlans.saving') : t('chargePlans.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
