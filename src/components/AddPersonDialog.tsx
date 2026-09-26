import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addPerson, getFirstUnusedPersonNumberOnDevice } from '../api/personService';
import { PersonError, type PersonErrorCode, type PersonPayload, type PersonType } from '../types/person';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface AddPersonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const PERSON_TYPE_OPTIONS: PersonType[] = [1, 2, 3, 4];

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

export function AddPersonDialog({ isOpen, onClose, onCreated }: AddPersonDialogProps) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [personType, setPersonType] = useState<PersonType>(1);
  const [personNumberOnDevice, setPersonNumberOnDevice] = useState('');
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [nationalId, setNationalId] = useState('');
  const [cellPhoneNumber, setCellPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<PersonErrorCode | null>(null);

  const reset = () => {
    setFirstName('');
    setLastName('');
    setPersonType(1);
    setPersonNumberOnDevice('');
    setStartDate(todayIsoDate());
    setNationalId('');
    setCellPhoneNumber('');
    setEmail('');
    setIsActive(true);
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      getFirstUnusedPersonNumberOnDevice()
        .then((n) => setPersonNumberOnDevice(String(n)))
        .catch(() => {
          // Non-critical — the field stays empty and editable if this fails.
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload: PersonPayload = {
      id: crypto.randomUUID(),
      personType,
      contractorContractId: null,
      personNumberOnDevice: Number(personNumberOnDevice),
      firstName,
      lastName,
      nationalId: nationalId || null,
      otherUniqueIdentificationCode: null,
      cellPhoneNumber: cellPhoneNumber || null,
      fixedTel: null,
      email: email || null,
      address: null,
      fatherName: null,
      startDate,
      endDate: null,
      birthday: null,
      emergencyContacts: null,
      additionalDescription: null,
      isActive,
      fieldOfStudyId: null,
      positionId: null,
      inactiveDescription: null,
      description: null,
      locationIds: null,
      personGroupIds: null,
      hasImage: false,
      imagePath: null,
      isImageChanged: false,
    };

    try {
      await addPerson(payload);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof PersonError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={720}>
      <h4 className="mb-4">{t('persons.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`persons.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('persons.fields.firstName')} htmlFor="personFirstName">
              <Input
                id="personFirstName"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('persons.fields.lastName')} htmlFor="personLastName">
              <Input
                id="personLastName"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('persons.fields.personType')} htmlFor="personType">
              <select
                id="personType"
                className="input"
                value={personType}
                onChange={(event) => setPersonType(Number(event.target.value) as PersonType)}
              >
                {PERSON_TYPE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t('persons.personTypeOption', { value })}
                  </option>
                ))}
              </select>
            </FormItem>

            <FormItem label={t('persons.fields.personNumberOnDevice')} htmlFor="personNumberOnDevice">
              <Input
                id="personNumberOnDevice"
                type="number"
                value={personNumberOnDevice}
                onChange={(event) => setPersonNumberOnDevice(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('persons.fields.startDate')} htmlFor="personStartDate">
              <Input
                id="personStartDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('persons.fields.nationalId')} htmlFor="personNationalId">
              <Input
                id="personNationalId"
                value={nationalId}
                onChange={(event) => setNationalId(event.target.value)}
              />
            </FormItem>

            <FormItem label={t('persons.fields.cellPhoneNumber')} htmlFor="personCellPhone">
              <Input
                id="personCellPhone"
                value={cellPhoneNumber}
                onChange={(event) => setCellPhoneNumber(event.target.value)}
              />
            </FormItem>
            <FormItem label={t('persons.fields.email')} htmlFor="personEmail">
              <Input
                id="personEmail"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </FormItem>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="accent-primary"
                />
                {t('persons.fields.isActive')}
              </label>
            </div>
          </div>

          <Button variant="solid" block type="submit" loading={isSubmitting} className="mt-5">
            {isSubmitting ? t('persons.saving') : t('persons.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
