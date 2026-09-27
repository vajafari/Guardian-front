import { useTranslation } from 'react-i18next';
import type { BuildingUnit } from '../types/buildingUnit';
import { Dialog } from './ui';

interface BuildingUnitViewDialogProps {
  isOpen: boolean;
  unit: BuildingUnit | null;
  onClose: () => void;
}

export function BuildingUnitViewDialog({ isOpen, unit, onClose }: BuildingUnitViewDialogProps) {
  const { t } = useTranslation();

  if (!unit) {
    return null;
  }

  const fields: Array<{ label: string; value: string }> = [
    { label: t('buildingUnits.fields.title'), value: String(unit.title) },
    { label: t('buildingUnits.fields.unitType'), value: t(`buildingUnits.unitTypes.${unit.unitType}`) },
    { label: t('buildingUnits.fields.buildingArea'), value: String(unit.buildingArea) },
    { label: t('buildingUnits.fields.residancePersons'), value: String(unit.residancePersons) },
    { label: t('buildingUnits.fields.telephoneNumbers'), value: unit.telephoneNumbers ?? '—' },
    { label: t('buildingUnits.fields.postalCode'), value: unit.postalCode ?? '—' },
    { label: t('buildingUnits.fields.isEmpty'), value: unit.isEmpty ? t('persons.detail.yes') : t('persons.detail.no') },
    { label: t('buildingUnits.fields.description'), value: unit.description ?? '—' },
  ];

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={480}>
      <h4 className="mb-4">{t('buildingUnits.viewTitle')}</h4>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {fields.map((field) => (
          <div key={field.label}>
            <div className="text-xs text-gray-500 dark:text-gray-400">{field.label}</div>
            <div className="text-sm">{field.value}</div>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
