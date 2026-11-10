import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { aggregateSaveContract, aggregateUpdateContract } from '../api/contractService';
import { searchBuildings } from '../api/buildingService';
import { searchBuildingUnitsByBuilding } from '../api/buildingUnitService';
import { searchBuildingSpaces } from '../api/buildingSpaceService';
import { searchPersonsByFullName } from '../api/personService';
import {
  ContractError,
  type ContractEditModel,
  type ContractErrorCode,
  type ContractPaymentPeriod,
  type ContractPaymentType,
  type ContractPersonRole,
  type ContractShareUnit,
  type ContractType,
} from '../types/contract';
import type { Building } from '../types/building';
import type { BuildingUnit } from '../types/buildingUnit';
import type { BuildingSpace } from '../types/buildingSpace';
import type { PersonSummary } from '../types/person';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface ContractFormDialogProps {
  isOpen: boolean;
  contract: ContractEditModel | null;
  onClose: () => void;
  onSaved: () => void;
}

type TargetType = 'unit' | 'space';

interface PersonRow {
  id: string;
  personId: string;
  personLabel: string;
  personRole: ContractPersonRole;
  shareAmount: string;
}

interface PaymentRow {
  id: string;
  paymentType: ContractPaymentType;
  paymentPeriod: ContractPaymentPeriod;
  paymentDayIndex: string;
  amount: string;
}

const OWNERSHIP_TYPES: ContractType[] = [1, 3];
const CONTRACT_TYPE_OPTIONS: ContractType[] = [1, 2, 3, 4];
const SHARE_UNIT_OPTIONS: ContractShareUnit[] = [1, 2];
const OWNERSHIP_PERSON_ROLES: ContractPersonRole[] = [1, 11];
const ALL_PERSON_ROLES: ContractPersonRole[] = [1, 11, 21, 22, 23];
const PRINCIPAL_ROLE: ContractPersonRole = 1;
const PAYMENT_TYPE_OPTIONS: ContractPaymentType[] = [1, 2];
const PAYMENT_PERIOD_OPTIONS: ContractPaymentPeriod[] = [1, 2, 3, 4, 5, 6];

function personLabel(person: PersonSummary): string {
  return [person.firstName, person.lastName].filter(Boolean).join(' ') || person.personNumberOnDevice.toString();
}

export function ContractFormDialog({ isOpen, contract, onClose, onSaved }: ContractFormDialogProps) {
  const { t } = useTranslation();
  const [buildingId, setBuildingId] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('unit');
  const [buildingUnitId, setBuildingUnitId] = useState('');
  const [buildingSpaceId, setBuildingSpaceId] = useState('');
  const [contractType, setContractType] = useState<ContractType>(1);
  const [shareUnit, setShareUnit] = useState<ContractShareUnit | ''>('');
  const [title, setTitle] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [personRows, setPersonRows] = useState<PersonRow[]>([]);
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([]);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<BuildingUnit[]>([]);
  const [spaces, setSpaces] = useState<BuildingSpace[]>([]);
  const [persons, setPersons] = useState<PersonSummary[]>([]);

  const [newPersonId, setNewPersonId] = useState('');
  const [newPersonRole, setNewPersonRole] = useState<ContractPersonRole>(PRINCIPAL_ROLE);
  const [newPersonShareAmount, setNewPersonShareAmount] = useState('');

  const [newPaymentType, setNewPaymentType] = useState<ContractPaymentType>(1);
  const [newPaymentPeriod, setNewPaymentPeriod] = useState<ContractPaymentPeriod>(3);
  const [newPaymentDayIndex, setNewPaymentDayIndex] = useState('1');
  const [newPaymentAmount, setNewPaymentAmount] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ContractErrorCode | null>(null);

  const isEdit = contract !== null;
  const isOwnershipType = OWNERSHIP_TYPES.includes(contractType);
  const personRoleOptions = isOwnershipType ? OWNERSHIP_PERSON_ROLES : ALL_PERSON_ROLES;

  const loadBuildingScopedData = async (id: string) => {
    if (!id) {
      setUnits([]);
      setSpaces([]);
      return;
    }
    const [buildingUnits, exclusiveSpaces] = await Promise.all([
      searchBuildingUnitsByBuilding(id),
      searchBuildingSpaces({ buildingIds: [id], spaceNatures: [1] }),
    ]);
    setUnits(buildingUnits);
    setSpaces(exclusiveSpaces);
  };

  const reset = () => {
    setBuildingId(contract?.buildingId ?? '');
    setTargetType(contract?.buildingSpaceId ? 'space' : 'unit');
    setBuildingUnitId(contract?.buildingUnitId ?? '');
    setBuildingSpaceId(contract?.buildingSpaceId ?? '');
    setContractType(contract?.contractType ?? 1);
    setShareUnit(contract?.shareUnit ?? '');
    setTitle(contract?.title ?? '');
    setContractNumber(contract?.contractNumber ?? '');
    setStartDate(contract?.startDate?.slice(0, 10) ?? '');
    setEndDate(contract?.endDate?.slice(0, 10) ?? '');
    setDescription(contract?.description ?? '');
    setPersonRows(
      contract?.contractPersonsFullInfo.map((person) => ({
        id: person.id,
        personId: person.personId,
        personLabel: [person.firstName, person.lastName].filter(Boolean).join(' ') || String(person.personNumberOnDevice),
        personRole: person.personRole,
        shareAmount: person.shareAmount != null ? String(person.shareAmount) : '',
      })) ?? [],
    );
    setPaymentRows(
      contract?.contractPaymentDetailsFullInfo.map((payment) => ({
        id: payment.id,
        paymentType: payment.paymentType,
        paymentPeriod: payment.paymentPeriod,
        paymentDayIndex: String(payment.paymentDayIndex),
        amount: payment.amount != null ? String(payment.amount) : '',
      })) ?? [],
    );
    setNewPersonId('');
    setNewPersonRole(PRINCIPAL_ROLE);
    setNewPersonShareAmount('');
    setNewPaymentType(1);
    setNewPaymentPeriod(3);
    setNewPaymentDayIndex('1');
    setNewPaymentAmount('');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      Promise.all([searchBuildings(), searchPersonsByFullName('', { itemsPerPage: 500 })]).then(
        ([buildingsResult, personsResult]) => {
          setBuildings(buildingsResult);
          setPersons(personsResult);
        },
      );
      loadBuildingScopedData(contract?.buildingId ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, contract]);

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

  const handleContractTypeChange = (newContractType: ContractType) => {
    setContractType(newContractType);
    if (!OWNERSHIP_TYPES.includes(newContractType)) {
      setShareUnit('');
    }
  };

  const addPersonRow = () => {
    if (!newPersonId || personRows.some((row) => row.personId === newPersonId)) return;
    const person = persons.find((candidate) => candidate.id === newPersonId);
    setPersonRows((rows) => [
      ...rows,
      {
        id: crypto.randomUUID(),
        personId: newPersonId,
        personLabel: person ? personLabel(person) : newPersonId,
        personRole: newPersonRole,
        shareAmount: newPersonRole === PRINCIPAL_ROLE ? newPersonShareAmount : '',
      },
    ]);
    setNewPersonId('');
    setNewPersonRole(PRINCIPAL_ROLE);
    setNewPersonShareAmount('');
  };

  const removePersonRow = (id: string) => {
    setPersonRows((rows) => rows.filter((row) => row.id !== id));
  };

  const addPaymentRow = () => {
    if (!newPaymentDayIndex) return;
    setPaymentRows((rows) => [
      ...rows,
      {
        id: crypto.randomUUID(),
        paymentType: newPaymentType,
        paymentPeriod: newPaymentPeriod,
        paymentDayIndex: newPaymentDayIndex,
        amount: newPaymentAmount,
      },
    ]);
    setNewPaymentType(1);
    setNewPaymentPeriod(3);
    setNewPaymentDayIndex('1');
    setNewPaymentAmount('');
  };

  const removePaymentRow = (id: string) => {
    setPaymentRows((rows) => rows.filter((row) => row.id !== id));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const targetId = targetType === 'unit' ? buildingUnitId : buildingSpaceId;
    if (!targetId) {
      setError('target-invalid');
      return;
    }
    if (endDate && endDate < startDate) {
      setError('end-date-before-start-date');
      return;
    }

    setIsSubmitting(true);
    const id = contract?.id ?? crypto.randomUUID();

    const payload = {
      id,
      title,
      contractNumber,
      contractType,
      buildingUnitId: targetType === 'unit' ? buildingUnitId : null,
      buildingSpaceId: targetType === 'space' ? buildingSpaceId : null,
      startDate,
      endDate: endDate || null,
      description: description || null,
      shareUnit: isOwnershipType && shareUnit !== '' ? shareUnit : null,
      contractPersons: personRows.map((row) => ({
        id: row.id,
        contractId: id,
        personId: row.personId,
        personRole: row.personRole,
        shareAmount: row.shareAmount === '' ? null : Number(row.shareAmount),
      })),
      contractPaymentDetails: paymentRows.map((row) => ({
        id: row.id,
        contractId: id,
        paymentType: row.paymentType,
        paymentPeriod: row.paymentPeriod,
        paymentDayIndex: Number(row.paymentDayIndex),
        amount: row.amount === '' ? null : Number(row.amount),
      })),
    };

    try {
      if (isEdit) {
        await aggregateUpdateContract(payload);
      } else {
        await aggregateSaveContract(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ContractError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availablePersons = persons.filter((person) => !personRows.some((row) => row.personId === person.id));

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={880}>
      <h4 className="mb-4">{isEdit ? t('contracts.editTitle') : t('contracts.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`contracts.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('contracts.fields.building')} htmlFor="contractBuilding">
              <select
                id="contractBuilding"
                className="input"
                value={buildingId}
                onChange={(event) => handleBuildingChange(event.target.value)}
                required
              >
                <option value="">—</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.title}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('contracts.fields.targetType')} htmlFor="contractTargetType">
              <div className="flex items-center gap-4 h-full">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="contractTargetType"
                    checked={targetType === 'unit'}
                    onChange={() => handleTargetTypeChange('unit')}
                  />
                  {t('contracts.targetTypes.unit')}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="contractTargetType"
                    checked={targetType === 'space'}
                    onChange={() => handleTargetTypeChange('space')}
                  />
                  {t('contracts.targetTypes.space')}
                </label>
              </div>
            </FormItem>
            {targetType === 'unit' ? (
              <FormItem label={t('contracts.fields.buildingUnit')} htmlFor="contractUnit">
                <select
                  id="contractUnit"
                  className="input"
                  value={buildingUnitId}
                  onChange={(event) => setBuildingUnitId(event.target.value)}
                  required
                >
                  <option value="">—</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.title}
                    </option>
                  ))}
                </select>
              </FormItem>
            ) : (
              <FormItem label={t('contracts.fields.buildingSpace')} htmlFor="contractSpace">
                <select
                  id="contractSpace"
                  className="input"
                  value={buildingSpaceId}
                  onChange={(event) => setBuildingSpaceId(event.target.value)}
                  required
                >
                  <option value="">—</option>
                  {spaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.title}
                    </option>
                  ))}
                </select>
              </FormItem>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('contracts.fields.title')} htmlFor="contractTitle">
              <Input id="contractTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </FormItem>
            <FormItem label={t('contracts.fields.contractNumber')} htmlFor="contractNumber">
              <Input
                id="contractNumber"
                value={contractNumber}
                onChange={(event) => setContractNumber(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('contracts.fields.contractType')} htmlFor="contractType">
              <select
                id="contractType"
                className="input"
                value={contractType}
                onChange={(event) => handleContractTypeChange(Number(event.target.value) as ContractType)}
              >
                {CONTRACT_TYPE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`contracts.contractTypes.${value}`)}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('contracts.fields.startDate')} htmlFor="contractStartDate">
              <Input id="contractStartDate" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
            </FormItem>
            <FormItem label={t('contracts.fields.endDate')} htmlFor="contractEndDate">
              <Input id="contractEndDate" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </FormItem>
            {isOwnershipType && (
              <FormItem label={t('contracts.fields.shareUnit')} htmlFor="contractShareUnit">
                {isEdit ? (
                  <Input
                    id="contractShareUnit"
                    disabled
                    value={shareUnit === '' ? '—' : t(`contracts.shareUnits.${shareUnit}`)}
                  />
                ) : (
                  <select
                    id="contractShareUnit"
                    className="input"
                    value={shareUnit}
                    onChange={(event) => setShareUnit(event.target.value === '' ? '' : (Number(event.target.value) as ContractShareUnit))}
                  >
                    <option value="">—</option>
                    {SHARE_UNIT_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {t(`contracts.shareUnits.${value}`)}
                      </option>
                    ))}
                  </select>
                )}
              </FormItem>
            )}
          </div>

          <FormItem label={t('contracts.fields.description')} htmlFor="contractDescription">
            <Input id="contractDescription" textArea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
          </FormItem>

          <h5 className="mt-4 mb-2">{t('contracts.contractPersons.title')}</h5>
          <div className="grid grid-cols-4 gap-2 items-end mb-2">
            <select className="input" value={newPersonId} onChange={(event) => setNewPersonId(event.target.value)}>
              <option value="">{t('contracts.contractPersons.selectPerson')}</option>
              {availablePersons.map((person) => (
                <option key={person.id} value={person.id}>
                  {personLabel(person)}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={newPersonRole}
              onChange={(event) => setNewPersonRole(Number(event.target.value) as ContractPersonRole)}
            >
              {personRoleOptions.map((value) => (
                <option key={value} value={value}>
                  {t(`contracts.contractPersonRoles.${value}`)}
                </option>
              ))}
            </select>
            <Input
              type="number"
              step="0.001"
              placeholder={t('contracts.contractPersons.shareAmount')}
              value={newPersonShareAmount}
              onChange={(event) => setNewPersonShareAmount(event.target.value)}
              disabled={newPersonRole !== PRINCIPAL_ROLE}
            />
            <Button type="button" icon={<HiOutlinePlus />} onClick={addPersonRow}>
              {t('common.add')}
            </Button>
          </div>
          {personRows.length > 0 && (
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-1.5 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('contracts.contractPersons.person')}
                    </th>
                    <th className="py-1.5 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('contracts.contractPersons.role')}
                    </th>
                    <th className="py-1.5 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('contracts.contractPersons.shareAmount')}
                    </th>
                    <th className="py-1.5 px-2 text-end font-semibold text-gray-500 dark:text-gray-400" />
                  </tr>
                </thead>
                <tbody>
                  {personRows.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-1.5 px-2">{row.personLabel}</td>
                      <td className="py-1.5 px-2">{t(`contracts.contractPersonRoles.${row.personRole}`)}</td>
                      <td className="py-1.5 px-2">{row.shareAmount || '—'}</td>
                      <td className="py-1.5 px-2 text-end">
                        <Button variant="plain" size="xs" icon={<HiOutlineTrash />} onClick={() => removePersonRow(row.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h5 className="mt-4 mb-2">{t('contracts.contractPaymentDetails.title')}</h5>
          <div className="grid grid-cols-5 gap-2 items-end mb-2">
            <select
              className="input"
              value={newPaymentType}
              onChange={(event) => setNewPaymentType(Number(event.target.value) as ContractPaymentType)}
            >
              {PAYMENT_TYPE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {t(`contracts.contractPaymentTypes.${value}`)}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={newPaymentPeriod}
              onChange={(event) => setNewPaymentPeriod(Number(event.target.value) as ContractPaymentPeriod)}
            >
              {PAYMENT_PERIOD_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {t(`contracts.contractPaymentPeriods.${value}`)}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min={1}
              placeholder={t('contracts.contractPaymentDetails.paymentDayIndex')}
              value={newPaymentDayIndex}
              onChange={(event) => setNewPaymentDayIndex(event.target.value)}
            />
            <Input
              type="number"
              placeholder={t('contracts.contractPaymentDetails.amount')}
              value={newPaymentAmount}
              onChange={(event) => setNewPaymentAmount(event.target.value)}
            />
            <Button type="button" icon={<HiOutlinePlus />} onClick={addPaymentRow}>
              {t('common.add')}
            </Button>
          </div>
          {paymentRows.length > 0 && (
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-1.5 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('contracts.contractPaymentDetails.paymentType')}
                    </th>
                    <th className="py-1.5 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('contracts.contractPaymentDetails.paymentPeriod')}
                    </th>
                    <th className="py-1.5 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('contracts.contractPaymentDetails.paymentDayIndex')}
                    </th>
                    <th className="py-1.5 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('contracts.contractPaymentDetails.amount')}
                    </th>
                    <th className="py-1.5 px-2 text-end font-semibold text-gray-500 dark:text-gray-400" />
                  </tr>
                </thead>
                <tbody>
                  {paymentRows.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-1.5 px-2">{t(`contracts.contractPaymentTypes.${row.paymentType}`)}</td>
                      <td className="py-1.5 px-2">{t(`contracts.contractPaymentPeriods.${row.paymentPeriod}`)}</td>
                      <td className="py-1.5 px-2">{row.paymentDayIndex}</td>
                      <td className="py-1.5 px-2">{row.amount || '—'}</td>
                      <td className="py-1.5 px-2 text-end">
                        <Button variant="plain" size="xs" icon={<HiOutlineTrash />} onClick={() => removePaymentRow(row.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Button variant="solid" block type="submit" loading={isSubmitting} className="mt-2">
            {isSubmitting ? t('contracts.saving') : t('contracts.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
