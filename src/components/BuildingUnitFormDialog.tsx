import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addBuildingUnit, updateBuildingUnit } from '../api/buildingUnitService';
import { BuildingUnitError, type BuildingUnit, type BuildingUnitErrorCode, type UnitType } from '../types/buildingUnit';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface BuildingUnitFormDialogProps {
  isOpen: boolean;
  buildingFloorId: string;
  unit: BuildingUnit | null;
  onClose: () => void;
  onSaved: () => void;
}

const UNIT_TYPE_OPTIONS: UnitType[] = [1, 2, 3, 4, 5];

export function BuildingUnitFormDialog({ isOpen, buildingFloorId, unit, onClose, onSaved }: BuildingUnitFormDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [unitType, setUnitType] = useState<UnitType>(1);
  const [description, setDescription] = useState('');
  const [telephoneNumbers, setTelephoneNumbers] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isEmpty, setIsEmpty] = useState(false);
  const [buildingArea, setBuildingArea] = useState('');
  const [residancePersons, setResidancePersons] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<BuildingUnitErrorCode | null>(null);

  const isEdit = unit !== null;

  const reset = () => {
    setTitle(unit ? String(unit.title) : '');
    setUnitType(unit?.unitType ?? 1);
    setDescription(unit?.description ?? '');
    setTelephoneNumbers(unit?.telephoneNumbers ?? '');
    setPostalCode(unit?.postalCode ?? '');
    setIsEmpty(unit?.isEmpty ?? false);
    setBuildingArea(unit ? String(unit.buildingArea) : '');
    setResidancePersons(unit ? String(unit.residancePersons) : '0');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, unit]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: unit?.id ?? crypto.randomUUID(),
      buildingFloorId,
      title: Number(title),
      description: description || null,
      telephoneNumbers: telephoneNumbers || null,
      postalCode: postalCode || null,
      isEmpty,
      unitType,
      buildingArea: Number(buildingArea),
      residancePersons: Number(residancePersons),
    };

    try {
      if (isEdit) {
        await updateBuildingUnit(payload);
      } else {
        await addBuildingUnit(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof BuildingUnitError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={640}>
      <h4 className="mb-4">{isEdit ? t('buildingUnits.editTitle') : t('buildingUnits.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`buildingUnits.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('buildingUnits.fields.title')} htmlFor="unitTitle">
              <Input id="unitTitle" type="number" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </FormItem>
            <FormItem label={t('buildingUnits.fields.unitType')} htmlFor="unitType">
              <select
                id="unitType"
                className="input"
                value={unitType}
                onChange={(event) => setUnitType(Number(event.target.value) as UnitType)}
              >
                {UNIT_TYPE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`buildingUnits.unitTypes.${value}`)}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('buildingUnits.fields.telephoneNumbers')} htmlFor="unitTelephoneNumbers">
              <Input
                id="unitTelephoneNumbers"
                value={telephoneNumbers}
                onChange={(event) => setTelephoneNumbers(event.target.value)}
              />
            </FormItem>
            <FormItem label={t('buildingUnits.fields.postalCode')} htmlFor="unitPostalCode">
              <Input id="unitPostalCode" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} />
            </FormItem>
            <FormItem label={t('buildingUnits.fields.buildingArea')} htmlFor="unitBuildingArea">
              <Input
                id="unitBuildingArea"
                type="number"
                step="0.01"
                value={buildingArea}
                onChange={(event) => setBuildingArea(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('buildingUnits.fields.residancePersons')} htmlFor="unitResidancePersons">
              <Input
                id="unitResidancePersons"
                type="number"
                value={residancePersons}
                onChange={(event) => setResidancePersons(event.target.value)}
              />
            </FormItem>
          </div>

          <FormItem label={t('buildingUnits.fields.description')} htmlFor="unitDescription">
            <Input id="unitDescription" textArea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
          </FormItem>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none mb-5">
            <input
              type="checkbox"
              checked={isEmpty}
              onChange={(event) => setIsEmpty(event.target.checked)}
              className="accent-primary"
            />
            {t('buildingUnits.fields.isEmpty')}
          </label>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('buildingUnits.saving') : t('buildingUnits.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
