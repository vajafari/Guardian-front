import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { saveCabinetPersons } from '../api/cabinetRoomService';
import { searchPersonsByFullName } from '../api/personService';
import { CabinetRoomError, type CabinetRoomErrorCode } from '../types/cabinetRoom';
import type { PersonSummary } from '../types/person';
import { Alert, Button, Dialog, FormContainer, FormItem } from './ui';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface CabinetPersonsDialogProps {
  isOpen: boolean;
  cabinetId: string | null;
  cabinetNumber: number | null;
  initialPersonIds: string[];
  onClose: () => void;
  onSaved: () => void;
}

function personLabel(person: PersonSummary): string {
  return [person.firstName, person.lastName].filter(Boolean).join(' ') || person.personNumberOnDevice.toString();
}

export function CabinetPersonsDialog({
  isOpen,
  cabinetId,
  cabinetNumber,
  initialPersonIds,
  onClose,
  onSaved,
}: CabinetPersonsDialogProps) {
  const { t } = useTranslation();
  const [persons, setPersons] = useState<PersonSummary[]>([]);
  const [personIds, setPersonIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<CabinetRoomErrorCode | null>(null);

  useEffect(() => {
    if (isOpen && cabinetId) {
      setError(null);
      setPersonIds(initialPersonIds);
      setIsLoading(true);
      searchPersonsByFullName('', { itemsPerPage: 500 })
        .then(setPersons)
        .finally(() => setIsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cabinetId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cabinetId) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await saveCabinetPersons(cabinetId, personIds, null);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof CabinetRoomError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={520}>
      <h4 className="mb-4">{t('cabinetRooms.cabinetPersons.title', { cabinetNumber })}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`cabinetRooms.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('cabinetRooms.cabinetPersons.persons')} htmlFor="cabinetPersons">
            <MultiSelectDropdown
              id="cabinetPersons"
              options={persons.map((person) => ({ value: person.id, label: personLabel(person) }))}
              selectedValues={personIds}
              onChange={setPersonIds}
            />
          </FormItem>

          <Button variant="solid" block type="submit" loading={isSubmitting || isLoading} disabled={isLoading}>
            {isSubmitting ? t('cabinetRooms.saving') : t('cabinetRooms.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
