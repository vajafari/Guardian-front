import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addBuildingParkingSpot, updateBuildingParkingSpot } from '../api/buildingParkingSpotService';
import { BuildingParkingSpotError, type BuildingParkingSpot, type BuildingParkingSpotErrorCode } from '../types/buildingParkingSpot';
import type { BuildingUnit } from '../types/buildingUnit';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface BuildingParkingSpotFormDialogProps {
  isOpen: boolean;
  buildingFloorId: string;
  units: BuildingUnit[];
  parkingSpot: BuildingParkingSpot | null;
  onClose: () => void;
  onSaved: () => void;
}

export function BuildingParkingSpotFormDialog({
  isOpen,
  buildingFloorId,
  units,
  parkingSpot,
  onClose,
  onSaved,
}: BuildingParkingSpotFormDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [parkingSpotNumber, setParkingSpotNumber] = useState('');
  const [buildingUnitId, setBuildingUnitId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<BuildingParkingSpotErrorCode | null>(null);

  const isEdit = parkingSpot !== null;

  const reset = () => {
    setTitle(parkingSpot?.title ?? '');
    setParkingSpotNumber(parkingSpot?.parkingSpotNumber ?? '');
    setBuildingUnitId(parkingSpot?.buildingUnitId ?? '');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, parkingSpot]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: parkingSpot?.id ?? crypto.randomUUID(),
      buildingFloorId,
      title,
      parkingSpotNumber,
      buildingUnitId: buildingUnitId || null,
    };

    try {
      if (isEdit) {
        await updateBuildingParkingSpot(payload);
      } else {
        await addBuildingParkingSpot(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof BuildingParkingSpotError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={420}>
      <h4 className="mb-4">{isEdit ? t('buildingParkingSpots.editTitle') : t('buildingParkingSpots.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`buildingParkingSpots.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('buildingParkingSpots.fields.title')} htmlFor="parkingSpotTitle">
            <Input id="parkingSpotTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </FormItem>
          <FormItem label={t('buildingParkingSpots.fields.parkingSpotNumber')} htmlFor="parkingSpotNumber">
            <Input
              id="parkingSpotNumber"
              value={parkingSpotNumber}
              onChange={(event) => setParkingSpotNumber(event.target.value)}
              required
            />
          </FormItem>
          <FormItem label={t('buildingParkingSpots.fields.buildingUnitId')} htmlFor="parkingSpotUnit">
            <select
              id="parkingSpotUnit"
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
            {isSubmitting ? t('buildingParkingSpots.saving') : t('buildingParkingSpots.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
