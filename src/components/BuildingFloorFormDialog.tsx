import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addBuildingFloor, updateBuildingFloor } from '../api/buildingFloorService';
import { BuildingFloorError, type BuildingFloor, type BuildingFloorErrorCode } from '../types/buildingFloor';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface BuildingFloorFormDialogProps {
  isOpen: boolean;
  buildingId: string;
  floor: BuildingFloor | null;
  onClose: () => void;
  onSaved: () => void;
}

export function BuildingFloorFormDialog({ isOpen, buildingId, floor, onClose, onSaved }: BuildingFloorFormDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [floorActualNumber, setFloorActualNumber] = useState('');
  const [floorHardwareNumber, setFloorHardwareNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<BuildingFloorErrorCode | null>(null);

  const isEdit = floor !== null;

  const reset = () => {
    setTitle(floor?.title ?? '');
    setFloorActualNumber(floor ? String(floor.floorActualNumber) : '0');
    setFloorHardwareNumber(floor ? String(floor.floorHardwareNumber) : '0');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, floor]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: floor?.id ?? crypto.randomUUID(),
      buildingId,
      title,
      floorActualNumber: Number(floorActualNumber),
      floorHardwareNumber: Number(floorHardwareNumber),
    };

    try {
      if (isEdit) {
        await updateBuildingFloor(payload);
      } else {
        await addBuildingFloor(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof BuildingFloorError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={420}>
      <h4 className="mb-4">{isEdit ? t('buildingFloors.editTitle') : t('buildingFloors.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`buildingFloors.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('buildingFloors.fields.title')} htmlFor="floorTitle">
            <Input id="floorTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </FormItem>
          <FormItem label={t('buildingFloors.fields.floorActualNumber')} htmlFor="floorActualNumber">
            <Input
              id="floorActualNumber"
              type="number"
              value={floorActualNumber}
              onChange={(event) => setFloorActualNumber(event.target.value)}
            />
          </FormItem>
          <FormItem label={t('buildingFloors.fields.floorHardwareNumber')} htmlFor="floorHardwareNumber">
            <Input
              id="floorHardwareNumber"
              type="number"
              value={floorHardwareNumber}
              onChange={(event) => setFloorHardwareNumber(event.target.value)}
            />
          </FormItem>

          <Button variant="solid" block type="submit" loading={isSubmitting} className="mt-2">
            {isSubmitting ? t('buildingFloors.saving') : t('buildingFloors.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
