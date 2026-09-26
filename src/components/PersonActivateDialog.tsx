import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { activatePerson } from '../api/personService';
import { PersonError, type PersonErrorCode } from '../types/person';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface PersonActivateDialogProps {
  isOpen: boolean;
  personId: string;
  onClose: () => void;
  onActivated: () => void;
}

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

export function PersonActivateDialog({ isOpen, personId, onClose, onActivated }: PersonActivateDialogProps) {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [endDate, setEndDate] = useState('');
  const [sync, setSync] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<PersonErrorCode | null>(null);

  const reset = () => {
    setStartDate(todayIsoDate());
    setEndDate('');
    setSync(true);
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await activatePerson({ id: personId, startDate, endDate: endDate || null, sync });
      onActivated();
      onClose();
    } catch (err) {
      setError(err instanceof PersonError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={420}>
      <h4 className="mb-4">{t('persons.activate.title')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`persons.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('persons.fields.startDate')} htmlFor="activateStartDate">
            <Input
              id="activateStartDate"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </FormItem>
          <FormItem label={t('persons.detail.endDate')} htmlFor="activateEndDate">
            <Input id="activateEndDate" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </FormItem>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none mb-5">
            <input
              type="checkbox"
              checked={sync}
              onChange={(event) => setSync(event.target.checked)}
              className="accent-primary"
            />
            {t('persons.activate.sync')}
          </label>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('persons.saving') : t('persons.activate.submit')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
