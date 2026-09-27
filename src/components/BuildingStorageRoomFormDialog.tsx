import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addBuildingStorageRoom, updateBuildingStorageRoom } from '../api/buildingStorageRoomService';
import {
  BuildingStorageRoomError,
  type BuildingStorageRoom,
  type BuildingStorageRoomErrorCode,
} from '../types/buildingStorageRoom';
import type { BuildingUnit } from '../types/buildingUnit';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface BuildingStorageRoomFormDialogProps {
  isOpen: boolean;
  buildingFloorId: string;
  units: BuildingUnit[];
  storageRoom: BuildingStorageRoom | null;
  onClose: () => void;
  onSaved: () => void;
}

export function BuildingStorageRoomFormDialog({
  isOpen,
  buildingFloorId,
  units,
  storageRoom,
  onClose,
  onSaved,
}: BuildingStorageRoomFormDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [storageRoomNumber, setStorageRoomNumber] = useState('');
  const [buildingUnitId, setBuildingUnitId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<BuildingStorageRoomErrorCode | null>(null);

  const isEdit = storageRoom !== null;

  const reset = () => {
    setTitle(storageRoom?.title ?? '');
    setStorageRoomNumber(storageRoom?.storageRoomNumber ?? '');
    setBuildingUnitId(storageRoom?.buildingUnitId ?? '');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, storageRoom]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: storageRoom?.id ?? crypto.randomUUID(),
      buildingFloorId,
      title,
      storageRoomNumber,
      buildingUnitId: buildingUnitId || null,
    };

    try {
      if (isEdit) {
        await updateBuildingStorageRoom(payload);
      } else {
        await addBuildingStorageRoom(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof BuildingStorageRoomError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={420}>
      <h4 className="mb-4">{isEdit ? t('buildingStorageRooms.editTitle') : t('buildingStorageRooms.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`buildingStorageRooms.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('buildingStorageRooms.fields.title')} htmlFor="storageRoomTitle">
            <Input id="storageRoomTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </FormItem>
          <FormItem label={t('buildingStorageRooms.fields.storageRoomNumber')} htmlFor="storageRoomNumber">
            <Input
              id="storageRoomNumber"
              value={storageRoomNumber}
              onChange={(event) => setStorageRoomNumber(event.target.value)}
              required
            />
          </FormItem>
          <FormItem label={t('buildingStorageRooms.fields.buildingUnitId')} htmlFor="storageRoomUnit">
            <select
              id="storageRoomUnit"
              className="input"
              value={buildingUnitId}
              onChange={(event) => setBuildingUnitId(event.target.value)}
            >
              <option value="">—</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.title}
                </option>
              ))}
            </select>
          </FormItem>

          <Button variant="solid" block type="submit" loading={isSubmitting} className="mt-2">
            {isSubmitting ? t('buildingStorageRooms.saving') : t('buildingStorageRooms.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
