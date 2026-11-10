import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { saveElevator } from '../api/elevatorService';
import { searchBuildings } from '../api/buildingService';
import { listLocations } from '../api/locationService';
import { ElevatorError, type Elevator, type ElevatorErrorCode } from '../types/elevator';
import type { Building } from '../types/building';
import type { Location } from '../types/location';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

const EMPTY_ID = '00000000-0000-0000-0000-000000000000';

interface ElevatorFormDialogProps {
  isOpen: boolean;
  elevator: Elevator | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FloorRow {
  id: string;
  title: string;
  actualFloorNumber: string;
  hardwareFloorNumber: string;
}

export function ElevatorFormDialog({ isOpen, elevator, onClose, onSaved }: ElevatorFormDialogProps) {
  const { t } = useTranslation();
  const [buildingId, setBuildingId] = useState('');
  const [title, setTitle] = useState('');
  const [floorCount, setFloorCount] = useState('1');
  const [locationId, setLocationId] = useState('');
  const [validFloorsText, setValidFloorsText] = useState('');
  const [floorRows, setFloorRows] = useState<FloorRow[]>([]);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [newFloorTitle, setNewFloorTitle] = useState('');
  const [newActualFloorNumber, setNewActualFloorNumber] = useState('');
  const [newHardwareFloorNumber, setNewHardwareFloorNumber] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ElevatorErrorCode | null>(null);

  const isEdit = elevator !== null;

  const reset = () => {
    setBuildingId(elevator?.buildingId ?? '');
    setTitle(elevator?.title ?? '');
    setFloorCount(elevator ? String(elevator.floorCount) : '1');
    setLocationId(elevator?.locationId ?? '');
    setValidFloorsText(elevator?.validFloors.join(', ') ?? '');
    setFloorRows(
      elevator?.elevatorFloors.map((floor) => ({
        id: floor.id,
        title: floor.title,
        actualFloorNumber: String(floor.actualFloorNumber),
        hardwareFloorNumber: String(floor.hardwareFloorNumber),
      })) ?? [],
    );
    setNewFloorTitle('');
    setNewActualFloorNumber('');
    setNewHardwareFloorNumber('');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      Promise.all([searchBuildings(), listLocations()]).then(([buildingsResult, locationsResult]) => {
        setBuildings(buildingsResult);
        setLocations(locationsResult);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, elevator]);

  const addFloorRow = () => {
    if (!newFloorTitle.trim() || !newActualFloorNumber || !newHardwareFloorNumber) return;
    setFloorRows((rows) => [
      ...rows,
      {
        id: EMPTY_ID,
        title: newFloorTitle,
        actualFloorNumber: newActualFloorNumber,
        hardwareFloorNumber: newHardwareFloorNumber,
      },
    ]);
    setNewFloorTitle('');
    setNewActualFloorNumber('');
    setNewHardwareFloorNumber('');
  };

  const removeFloorRow = (index: number) => {
    setFloorRows((rows) => rows.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (floorRows.length === 0) {
      setError('floors-invalid');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      id: elevator?.id ?? crypto.randomUUID(),
      title,
      buildingId,
      floorCount: Number(floorCount),
      validFloors: validFloorsText
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((n) => Number.isFinite(n)),
      locationId,
      elevatorFloors: floorRows.map((row) => ({
        id: row.id,
        title: row.title,
        actualFloorNumber: Number(row.actualFloorNumber),
        hardwareFloorNumber: Number(row.hardwareFloorNumber),
      })),
    };

    try {
      await saveElevator(payload, isEdit);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ElevatorError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={760}>
      <h4 className="mb-4">{isEdit ? t('elevators.editTitle') : t('elevators.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`elevators.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('elevators.fields.building')} htmlFor="elevatorBuilding">
              <select id="elevatorBuilding" className="input" value={buildingId} onChange={(event) => setBuildingId(event.target.value)} required>
                <option value="">—</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.title}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('elevators.fields.location')} htmlFor="elevatorLocation">
              <select id="elevatorLocation" className="input" value={locationId} onChange={(event) => setLocationId(event.target.value)} required>
                <option value="">—</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.title}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('elevators.fields.floorCount')} htmlFor="elevatorFloorCount">
              <Input id="elevatorFloorCount" type="number" min={1} value={floorCount} onChange={(event) => setFloorCount(event.target.value)} required />
            </FormItem>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('elevators.fields.title')} htmlFor="elevatorTitle">
              <Input id="elevatorTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </FormItem>
            <FormItem label={t('elevators.fields.validFloors')} htmlFor="elevatorValidFloors">
              <Input
                id="elevatorValidFloors"
                value={validFloorsText}
                onChange={(event) => setValidFloorsText(event.target.value)}
                placeholder="1, 2, 3"
              />
            </FormItem>
          </div>

          <h5 className="mt-4 mb-2">{t('elevators.floors.title')}</h5>
          <div className="grid grid-cols-4 gap-2 items-end mb-2">
            <Input
              placeholder={t('elevators.floors.floorTitle')}
              value={newFloorTitle}
              onChange={(event) => setNewFloorTitle(event.target.value)}
            />
            <Input
              type="number"
              placeholder={t('elevators.floors.actualFloorNumber')}
              value={newActualFloorNumber}
              onChange={(event) => setNewActualFloorNumber(event.target.value)}
            />
            <Input
              type="number"
              placeholder={t('elevators.floors.hardwareFloorNumber')}
              value={newHardwareFloorNumber}
              onChange={(event) => setNewHardwareFloorNumber(event.target.value)}
            />
            <Button type="button" icon={<HiOutlinePlus />} onClick={addFloorRow}>
              {t('common.add')}
            </Button>
          </div>
          {floorRows.length > 0 && (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-1.5 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('elevators.floors.floorTitle')}
                    </th>
                    <th className="py-1.5 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('elevators.floors.actualFloorNumber')}
                    </th>
                    <th className="py-1.5 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('elevators.floors.hardwareFloorNumber')}
                    </th>
                    <th className="py-1.5 px-2 text-end font-semibold text-gray-500 dark:text-gray-400" />
                  </tr>
                </thead>
                <tbody>
                  {floorRows.map((row, index) => (
                    <tr key={`${row.id}-${index}`} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-1.5 px-2">{row.title}</td>
                      <td className="py-1.5 px-2">{row.actualFloorNumber}</td>
                      <td className="py-1.5 px-2">{row.hardwareFloorNumber}</td>
                      <td className="py-1.5 px-2 text-end">
                        <Button variant="plain" size="xs" icon={<HiOutlineTrash />} onClick={() => removeFloorRow(index)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('elevators.saving') : t('elevators.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
