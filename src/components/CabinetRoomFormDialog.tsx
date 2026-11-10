import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { saveCabinetRoom } from '../api/cabinetRoomService';
import { listLocations } from '../api/locationService';
import { CabinetRoomError, type CabinetRoom, type CabinetRoomErrorCode } from '../types/cabinetRoom';
import type { Location } from '../types/location';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

const EMPTY_ID = '00000000-0000-0000-0000-000000000000';

interface CabinetRoomFormDialogProps {
  isOpen: boolean;
  cabinetRoom: CabinetRoom | null;
  onClose: () => void;
  onSaved: () => void;
}

interface CabinetRow {
  id: string;
  cabinetNumber: string;
  description: string;
}

export function CabinetRoomFormDialog({ isOpen, cabinetRoom, onClose, onSaved }: CabinetRoomFormDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('1');
  const [locationId, setLocationId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isShared, setIsShared] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [isMultiple, setIsMultiple] = useState(false);
  const [cabinetRows, setCabinetRows] = useState<CabinetRow[]>([]);

  const [locations, setLocations] = useState<Location[]>([]);

  const [newCabinetNumber, setNewCabinetNumber] = useState('');
  const [newCabinetDescription, setNewCabinetDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<CabinetRoomErrorCode | null>(null);

  const isEdit = cabinetRoom !== null;

  const reset = () => {
    setTitle(cabinetRoom?.title ?? '');
    setDescription(cabinetRoom?.description ?? '');
    setCapacity(cabinetRoom ? String(cabinetRoom.capacity) : '1');
    setLocationId(cabinetRoom?.locationId ?? '');
    setIsActive(cabinetRoom?.isActive ?? true);
    setIsShared(cabinetRoom?.isShared ?? false);
    setIsAuto(cabinetRoom?.isAuto ?? false);
    setIsMultiple(cabinetRoom?.isMultiple ?? false);
    setCabinetRows(
      cabinetRoom?.cabinets.map((cabinet) => ({
        id: cabinet.id,
        cabinetNumber: String(cabinet.cabinetNumber),
        description: cabinet.description ?? '',
      })) ?? [],
    );
    setNewCabinetNumber('');
    setNewCabinetDescription('');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      listLocations().then(setLocations);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cabinetRoom]);

  const addCabinetRow = () => {
    if (!newCabinetNumber) return;
    setCabinetRows((rows) => [...rows, { id: EMPTY_ID, cabinetNumber: newCabinetNumber, description: newCabinetDescription }]);
    setNewCabinetNumber('');
    setNewCabinetDescription('');
  };

  const removeCabinetRow = (index: number) => {
    setCabinetRows((rows) => rows.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (cabinetRows.length === 0) {
      setError('cabinets-empty');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      id: cabinetRoom?.id ?? crypto.randomUUID(),
      title,
      description: description || null,
      capacity: Number(capacity),
      isActive,
      isShared,
      isAuto,
      isMultiple,
      locationId,
      cabinets: cabinetRows.map((row) => ({
        id: row.id,
        cabinetNumber: Number(row.cabinetNumber),
        description: row.description || null,
      })),
    };

    try {
      await saveCabinetRoom(payload, isEdit);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof CabinetRoomError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={760}>
      <h4 className="mb-4">{isEdit ? t('cabinetRooms.editTitle') : t('cabinetRooms.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`cabinetRooms.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('cabinetRooms.fields.title')} htmlFor="cabinetRoomTitle">
              <Input id="cabinetRoomTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </FormItem>
            <FormItem label={t('cabinetRooms.fields.location')} htmlFor="cabinetRoomLocation">
              <select
                id="cabinetRoomLocation"
                className="input"
                value={locationId}
                onChange={(event) => setLocationId(event.target.value)}
                required
              >
                <option value="">—</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.title}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('cabinetRooms.fields.capacity')} htmlFor="cabinetRoomCapacity">
              <Input
                id="cabinetRoomCapacity"
                type="number"
                min={1}
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                required
              />
            </FormItem>
          </div>

          <FormItem label={t('cabinetRooms.fields.description')} htmlFor="cabinetRoomDescription">
            <Input id="cabinetRoomDescription" value={description} onChange={(event) => setDescription(event.target.value)} />
          </FormItem>

          <div className="flex flex-wrap gap-5 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none">
              <input type="checkbox" checked={isShared} onChange={(event) => setIsShared(event.target.checked)} className="accent-primary" />
              {t('cabinetRooms.fields.isShared')}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none">
              <input type="checkbox" checked={isAuto} onChange={(event) => setIsAuto(event.target.checked)} className="accent-primary" />
              {t('cabinetRooms.fields.isAuto')}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none">
              <input type="checkbox" checked={isMultiple} onChange={(event) => setIsMultiple(event.target.checked)} className="accent-primary" />
              {t('cabinetRooms.fields.isMultiple')}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none">
              <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="accent-primary" />
              {t('cabinetRooms.fields.isActive')}
            </label>
          </div>

          <h5 className="mt-4 mb-2">{t('cabinetRooms.cabinets.title')}</h5>
          <div className="grid grid-cols-3 gap-2 items-end mb-2">
            <Input
              type="number"
              placeholder={t('cabinetRooms.cabinets.cabinetNumber')}
              value={newCabinetNumber}
              onChange={(event) => setNewCabinetNumber(event.target.value)}
            />
            <Input
              placeholder={t('cabinetRooms.cabinets.description')}
              value={newCabinetDescription}
              onChange={(event) => setNewCabinetDescription(event.target.value)}
            />
            <Button type="button" icon={<HiOutlinePlus />} onClick={addCabinetRow}>
              {t('common.add')}
            </Button>
          </div>
          {cabinetRows.length > 0 && (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-1.5 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('cabinetRooms.cabinets.cabinetNumber')}
                    </th>
                    <th className="py-1.5 px-2 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('cabinetRooms.cabinets.description')}
                    </th>
                    <th className="py-1.5 px-2 text-end font-semibold text-gray-500 dark:text-gray-400" />
                  </tr>
                </thead>
                <tbody>
                  {cabinetRows.map((row, index) => (
                    <tr key={`${row.id}-${index}`} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-1.5 px-2">{row.cabinetNumber}</td>
                      <td className="py-1.5 px-2">{row.description}</td>
                      <td className="py-1.5 px-2 text-end">
                        <Button variant="plain" size="xs" icon={<HiOutlineTrash />} onClick={() => removeCabinetRow(index)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('cabinetRooms.saving') : t('cabinetRooms.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
