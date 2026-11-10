import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { saveElevatorFloorPersons } from '../api/elevatorService';
import { searchPersonsOfElevatorFloor } from '../api/elevatorFloorPersonService';
import { searchPersonsByFullName } from '../api/personService';
import { ElevatorError, type ElevatorErrorCode } from '../types/elevator';
import type { PersonSummary } from '../types/person';
import { Alert, Button, Dialog, FormContainer, FormItem } from './ui';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface ElevatorFloorPersonsDialogProps {
  isOpen: boolean;
  elevatorFloorId: string | null;
  floorTitle: string;
  onClose: () => void;
  onSaved: () => void;
}

function personLabel(person: PersonSummary): string {
  return [person.firstName, person.lastName].filter(Boolean).join(' ') || person.personNumberOnDevice.toString();
}

export function ElevatorFloorPersonsDialog({
  isOpen,
  elevatorFloorId,
  floorTitle,
  onClose,
  onSaved,
}: ElevatorFloorPersonsDialogProps) {
  const { t } = useTranslation();
  const [persons, setPersons] = useState<PersonSummary[]>([]);
  const [personIds, setPersonIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ElevatorErrorCode | null>(null);

  const load = (floorId: string) => {
    setError(null);
    setIsLoading(true);
    Promise.all([searchPersonsByFullName('', { itemsPerPage: 500 }), searchPersonsOfElevatorFloor(floorId)])
      .then(([personsResult, currentAssignees]) => {
        setPersons(personsResult);
        setPersonIds(currentAssignees.map((row) => row.personId));
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (isOpen && elevatorFloorId) {
      load(elevatorFloorId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, elevatorFloorId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!elevatorFloorId) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await saveElevatorFloorPersons(elevatorFloorId, personIds, null);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ElevatorError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={520}>
      <h4 className="mb-4">{t('elevators.floorPersons.title', { floor: floorTitle })}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`elevators.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('elevators.floorPersons.persons')} htmlFor="elevatorFloorPersons">
            <MultiSelectDropdown
              id="elevatorFloorPersons"
              options={persons.map((person) => ({ value: person.id, label: personLabel(person) }))}
              selectedValues={personIds}
              onChange={setPersonIds}
            />
          </FormItem>

          <Button variant="solid" block type="submit" loading={isSubmitting || isLoading} disabled={isLoading}>
            {isSubmitting ? t('elevators.saving') : t('elevators.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
