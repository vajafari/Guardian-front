import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addPersonGroup, updatePersonGroup } from '../api/personGroupService';
import { searchPersonsByFullName } from '../api/personService';
import { PersonGroupError, type PersonGroupDetail, type PersonGroupErrorCode } from '../types/personGroup';
import type { PersonSummary } from '../types/person';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface PersonGroupFormDialogProps {
  isOpen: boolean;
  personGroup: PersonGroupDetail | null;
  onClose: () => void;
  onSaved: () => void;
}

function personLabel(person: PersonSummary): string {
  return [person.firstName, person.lastName].filter(Boolean).join(' ') || person.personNumberOnDevice.toString();
}

export function PersonGroupFormDialog({ isOpen, personGroup, onClose, onSaved }: PersonGroupFormDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [personIds, setPersonIds] = useState<string[]>([]);
  const [persons, setPersons] = useState<PersonSummary[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<PersonGroupErrorCode | null>(null);

  const isEdit = personGroup !== null;

  const reset = () => {
    setTitle(personGroup?.title ?? '');
    setDescription(personGroup?.description ?? '');
    setPersonIds(personGroup?.personGroupPersonsFullInfo.map((row) => row.personId) ?? []);
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      searchPersonsByFullName('', { itemsPerPage: 500 }).then(setPersons);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, personGroup]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: personGroup?.id ?? crypto.randomUUID(),
      title,
      description: description || null,
      personIds,
    };

    try {
      if (isEdit) {
        await updatePersonGroup(payload);
      } else {
        await addPersonGroup(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof PersonGroupError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={560}>
      <h4 className="mb-4">{isEdit ? t('personGroups.editTitle') : t('personGroups.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`personGroups.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('personGroups.fields.title')} htmlFor="personGroupTitle">
            <Input id="personGroupTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </FormItem>
          <FormItem label={t('personGroups.fields.description')} htmlFor="personGroupDescription">
            <Input
              id="personGroupDescription"
              textArea
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormItem>
          <FormItem label={t('personGroups.fields.persons')} htmlFor="personGroupPersons">
            <MultiSelectDropdown
              id="personGroupPersons"
              options={persons.map((person) => ({ value: person.id, label: personLabel(person) }))}
              selectedValues={personIds}
              onChange={setPersonIds}
            />
          </FormItem>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('personGroups.saving') : t('personGroups.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
