import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addLocation, updateLocation } from '../api/locationService';
import { LocationError, type Location, type LocationErrorCode } from '../types/location';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface LocationFormDialogProps {
  isOpen: boolean;
  location: Location | null;
  locations: Location[];
  onClose: () => void;
  onSaved: () => void;
}

export function LocationFormDialog({ isOpen, location, locations, onClose, onSaved }: LocationFormDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [locationNumber, setLocationNumber] = useState('');
  const [description, setDescription] = useState('');
  const [parentLocationId, setParentLocationId] = useState('');
  const [isAutoSyncDisabled, setIsAutoSyncDisabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<LocationErrorCode | null>(null);

  const isEdit = location !== null;

  const reset = () => {
    setTitle(location?.title ?? '');
    setLocationNumber(location ? String(location.locationNumber) : '');
    setDescription(location?.description ?? '');
    setParentLocationId(location?.parentLocationId ?? '');
    setIsAutoSyncDisabled(location?.isAutoSyncDisabled ?? false);
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, location]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: location?.id ?? crypto.randomUUID(),
      locationNumber: Number(locationNumber),
      title,
      description: description || null,
      parentLocationId: parentLocationId || null,
      isAutoSyncDisabled,
      personLocations: [] as [],
      personGroupLocations: [] as [],
    };

    try {
      if (isEdit) {
        await updateLocation(payload);
      } else {
        await addLocation(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof LocationError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parentOptions = locations.filter((candidate) => candidate.id !== location?.id);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={480}>
      <h4 className="mb-4">{isEdit ? t('locations.editTitle') : t('locations.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`locations.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('locations.fields.locationNumber')} htmlFor="locationNumber">
              <Input
                id="locationNumber"
                type="number"
                value={locationNumber}
                onChange={(event) => setLocationNumber(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('locations.fields.title')} htmlFor="locationTitle">
              <Input id="locationTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </FormItem>
          </div>

          <FormItem label={t('locations.fields.parentLocationId')} htmlFor="locationParent">
            <select
              id="locationParent"
              className="input"
              value={parentLocationId}
              onChange={(event) => setParentLocationId(event.target.value)}
            >
              <option value="">—</option>
              {parentOptions.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.title}
                </option>
              ))}
            </select>
          </FormItem>

          <FormItem label={t('locations.fields.description')} htmlFor="locationDescription">
            <Input
              id="locationDescription"
              textArea
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormItem>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none mb-5">
            <input
              type="checkbox"
              checked={isAutoSyncDisabled}
              onChange={(event) => setIsAutoSyncDisabled(event.target.checked)}
              className="accent-primary"
            />
            {t('locations.fields.isAutoSyncDisabled')}
          </label>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('locations.saving') : t('locations.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
