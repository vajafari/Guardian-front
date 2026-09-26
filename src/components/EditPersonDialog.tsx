import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { updatePerson } from '../api/personService';
import { PersonError, type PersonErrorCode, type PersonFullInfo, type PersonPayload, type PersonType } from '../types/person';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface EditPersonDialogProps {
  isOpen: boolean;
  person: PersonFullInfo;
  onClose: () => void;
  onUpdated: () => void;
}

const PERSON_TYPE_OPTIONS: PersonType[] = [1, 2, 3, 4];

export function EditPersonDialog({ isOpen, person, onClose, onUpdated }: EditPersonDialogProps) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [personType, setPersonType] = useState<PersonType>(1);
  const [personNumberOnDevice, setPersonNumberOnDevice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [cellPhoneNumber, setCellPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<PersonErrorCode | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFirstName(person.firstName ?? '');
      setLastName(person.lastName ?? '');
      setPersonType(person.personType);
      setPersonNumberOnDevice(String(person.personNumberOnDevice));
      setStartDate(person.startDate);
      setNationalId(person.nationalId ?? '');
      setCellPhoneNumber(person.cellPhoneNumber ?? '');
      setEmail(person.email ?? '');
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, person]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload: PersonPayload = {
      id: person.id,
      personType,
      contractorContractId: person.contractorContractId,
      personNumberOnDevice: Number(personNumberOnDevice),
      firstName,
      lastName,
      nationalId: nationalId || null,
      otherUniqueIdentificationCode: person.otherUniqueIdentificationCode,
      cellPhoneNumber: cellPhoneNumber || null,
      fixedTel: person.fixedTel,
      email: email || null,
      address: person.address,
      fatherName: person.fatherName,
      startDate,
      endDate: person.endDate,
      birthday: person.birthday,
      emergencyContacts: person.emergencyContacts,
      additionalDescription: person.additionalDescription,
      isActive: person.isActive,
      fieldOfStudyId: person.fieldOfStudyId,
      positionId: person.positionId,
      inactiveDescription: person.inactiveDescription,
      description: person.description,
      locationIds: null,
      personGroupIds: null,
      hasImage: false,
      imagePath: null,
      isImageChanged: false,
    };

    try {
      await updatePerson(payload);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof PersonError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={720}>
      <h4 className="mb-4">{t('persons.editTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`persons.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('persons.fields.firstName')} htmlFor="editPersonFirstName">
              <Input
                id="editPersonFirstName"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('persons.fields.lastName')} htmlFor="editPersonLastName">
              <Input
                id="editPersonLastName"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('persons.fields.personType')} htmlFor="editPersonType">
              <select
                id="editPersonType"
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

            <FormItem label={t('persons.fields.personNumberOnDevice')} htmlFor="editPersonNumberOnDevice">
              <Input
                id="editPersonNumberOnDevice"
                type="number"
                value={personNumberOnDevice}
                onChange={(event) => setPersonNumberOnDevice(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('persons.fields.startDate')} htmlFor="editPersonStartDate">
              <Input
                id="editPersonStartDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('persons.fields.nationalId')} htmlFor="editPersonNationalId">
              <Input
                id="editPersonNationalId"
                value={nationalId}
                onChange={(event) => setNationalId(event.target.value)}
              />
            </FormItem>

            <FormItem label={t('persons.fields.cellPhoneNumber')} htmlFor="editPersonCellPhone">
              <Input
                id="editPersonCellPhone"
                value={cellPhoneNumber}
                onChange={(event) => setCellPhoneNumber(event.target.value)}
              />
            </FormItem>
            <FormItem label={t('persons.fields.email')} htmlFor="editPersonEmail">
              <Input
                id="editPersonEmail"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </FormItem>
          </div>

          <Button variant="solid" block type="submit" loading={isSubmitting} className="mt-5">
            {isSubmitting ? t('persons.saving') : t('persons.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
