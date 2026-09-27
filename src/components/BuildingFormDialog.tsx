import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addBuilding, updateBuilding } from '../api/buildingService';
import { BuildingError, type Building, type BuildingErrorCode } from '../types/building';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface BuildingFormDialogProps {
  isOpen: boolean;
  building: Building | null;
  onClose: () => void;
  onSaved: () => void;
}

export function BuildingFormDialog({ isOpen, building, onClose, onSaved }: BuildingFormDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [buildingNumber, setBuildingNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<BuildingErrorCode | null>(null);

  const isEdit = building !== null;

  const reset = () => {
    setTitle(building?.title ?? '');
    setBuildingNumber(building ? String(building.buildingNumber) : '');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, building]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: building?.id ?? crypto.randomUUID(),
      buildingNumber: Number(buildingNumber),
      title,
    };

    try {
      if (isEdit) {
        await updateBuilding(payload);
      } else {
        await addBuilding(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof BuildingError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={420}>
      <h4 className="mb-4">{isEdit ? t('buildings.editTitle') : t('buildings.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`buildings.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('buildings.fields.buildingNumber')} htmlFor="buildingNumber">
            <Input
              id="buildingNumber"
              type="number"
              value={buildingNumber}
              onChange={(event) => setBuildingNumber(event.target.value)}
              required
            />
          </FormItem>
          <FormItem label={t('buildings.fields.title')} htmlFor="buildingTitle">
            <Input id="buildingTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </FormItem>

          <Button variant="solid" block type="submit" loading={isSubmitting} className="mt-2">
            {isSubmitting ? t('buildings.saving') : t('buildings.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
