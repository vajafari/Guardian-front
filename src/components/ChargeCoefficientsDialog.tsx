import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { deleteChargeCoefficient, saveChargeCoefficient, searchChargeCoefficientsByComponent } from '../api/chargeCoefficientService';
import {
  ChargeCoefficientError,
  type ChargeCoefficient,
  type ChargeCoefficientErrorCode,
  type ChargeCoefficientKind,
} from '../types/chargeCoefficient';
import type { UnitType } from '../types/buildingUnit';
import { Alert, Button, Dialog, FormItem, Input } from './ui';

const COEFFICIENT_KIND_OPTIONS: ChargeCoefficientKind[] = [1, 2];
const UNIT_TYPE_OPTIONS: UnitType[] = [1, 2, 3, 4, 5];

interface ChargeCoefficientsDialogProps {
  isOpen: boolean;
  chargeComponentId: string | null;
  chargeComponentTitle: string;
  onClose: () => void;
}

export function ChargeCoefficientsDialog({ isOpen, chargeComponentId, chargeComponentTitle, onClose }: ChargeCoefficientsDialogProps) {
  const { t } = useTranslation();
  const [coefficients, setCoefficients] = useState<ChargeCoefficient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [coefficientKind, setCoefficientKind] = useState<ChargeCoefficientKind>(1);
  const [unitType, setUnitType] = useState<UnitType>(1);
  const [floorActualNumber, setFloorActualNumber] = useState('0');
  const [coefficient, setCoefficient] = useState('1');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ChargeCoefficientErrorCode | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setCoefficientKind(1);
    setUnitType(1);
    setFloorActualNumber('0');
    setCoefficient('1');
    setDescription('');
    setError(null);
  };

  const load = () => {
    if (!chargeComponentId) return;
    setIsLoading(true);
    searchChargeCoefficientsByComponent(chargeComponentId)
      .then(setCoefficients)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (isOpen && chargeComponentId) {
      resetForm();
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, chargeComponentId]);

  const startEdit = (row: ChargeCoefficient) => {
    setEditingId(row.id);
    setCoefficientKind(row.coefficientKind);
    setUnitType(row.unitType ?? 1);
    setFloorActualNumber(row.floorActualNumber != null ? String(row.floorActualNumber) : '0');
    setCoefficient(String(row.coefficient));
    setDescription(row.description ?? '');
    setError(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteChargeCoefficient(id);
      load();
    } catch (err) {
      setError(err instanceof ChargeCoefficientError ? err.code : 'unknown');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chargeComponentId) return;
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: editingId ?? crypto.randomUUID(),
      chargeComponentId,
      coefficientKind,
      unitType: coefficientKind === 1 ? unitType : null,
      floorActualNumber: coefficientKind === 2 ? Number(floorActualNumber) : null,
      coefficient: Number(coefficient),
      description: description || null,
    };

    try {
      await saveChargeCoefficient(payload, editingId !== null);
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ChargeCoefficientError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={620}>
      <h4 className="mb-4">{t('chargePlans.coefficients.title', { component: chargeComponentTitle })}</h4>

      {error && (
        <Alert type="danger" className="mb-3">
          {t(`chargePlans.coefficients.errors.${error}`)}
        </Alert>
      )}

      {!isLoading && coefficients.length > 0 && (
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                <th className="py-1.5 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('chargePlans.coefficients.fields.kind')}
                </th>
                <th className="py-1.5 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('chargePlans.coefficients.fields.key')}
                </th>
                <th className="py-1.5 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('chargePlans.coefficients.fields.coefficient')}
                </th>
                <th className="py-1.5 px-2 text-end font-semibold text-gray-500 dark:text-gray-400" />
              </tr>
            </thead>
            <tbody>
              {coefficients.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="py-1.5 px-2">{t(`chargePlans.coefficients.kinds.${row.coefficientKind}`)}</td>
                  <td className="py-1.5 px-2">
                    {row.coefficientKind === 1 ? t(`buildingUnits.unitTypes.${row.unitType}`) : row.floorActualNumber}
                  </td>
                  <td className="py-1.5 px-2">{row.coefficient}</td>
                  <td className="py-1.5 px-2 text-end">
                    <Button variant="plain" size="xs" icon={<HiOutlinePencil />} onClick={() => startEdit(row)} />
                    <Button variant="plain" size="xs" icon={<HiOutlineTrash />} onClick={() => handleDelete(row.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-2 items-end mb-3">
          <FormItem label={t('chargePlans.coefficients.fields.kind')} htmlFor="coefficientKind">
            <select
              id="coefficientKind"
              className="input"
              value={coefficientKind}
              onChange={(event) => setCoefficientKind(Number(event.target.value) as ChargeCoefficientKind)}
            >
              {COEFFICIENT_KIND_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {t(`chargePlans.coefficients.kinds.${value}`)}
                </option>
              ))}
            </select>
          </FormItem>
          {coefficientKind === 1 ? (
            <FormItem label={t('chargePlans.coefficients.fields.unitType')} htmlFor="coefficientUnitType">
              <select id="coefficientUnitType" className="input" value={unitType} onChange={(event) => setUnitType(Number(event.target.value) as UnitType)}>
                {UNIT_TYPE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`buildingUnits.unitTypes.${value}`)}
                  </option>
                ))}
              </select>
            </FormItem>
          ) : (
            <FormItem label={t('chargePlans.coefficients.fields.floorActualNumber')} htmlFor="coefficientFloor">
              <Input id="coefficientFloor" type="number" value={floorActualNumber} onChange={(event) => setFloorActualNumber(event.target.value)} />
            </FormItem>
          )}
          <FormItem label={t('chargePlans.coefficients.fields.coefficient')} htmlFor="coefficientValue">
            <Input id="coefficientValue" type="number" min={0} step="any" value={coefficient} onChange={(event) => setCoefficient(event.target.value)} required />
          </FormItem>
        </div>

        <FormItem label={t('chargePlans.coefficients.fields.description')} htmlFor="coefficientDescription">
          <Input id="coefficientDescription" value={description} onChange={(event) => setDescription(event.target.value)} />
        </FormItem>

        <div className="flex gap-2 mt-3">
          {editingId && (
            <Button type="button" onClick={resetForm}>
              {t('common.cancel')}
            </Button>
          )}
          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {editingId ? t('chargePlans.coefficients.updateButton') : t('chargePlans.coefficients.addButton')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
