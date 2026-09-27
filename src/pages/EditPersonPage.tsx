import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { getPersonById, updatePerson } from '../api/personService';
import { getFieldOfStudies, getPositions } from '../api/referenceDataService';
import { PersonError, type PersonErrorCode, type PersonFullInfo, type PersonPayload, type PersonType } from '../types/person';
import type { FieldOfStudy, Position } from '../types/referenceData';
import { Alert, Button, Card, FormContainer, FormItem, Input, Spinner } from '../components/ui';

const PERSON_TYPE_OPTIONS: PersonType[] = [1, 2, 3, 4];

export function EditPersonPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [person, setPerson] = useState<PersonFullInfo | null>(null);
  const [fieldOfStudies, setFieldOfStudies] = useState<FieldOfStudy[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [personType, setPersonType] = useState<PersonType>(1);
  const [personNumberOnDevice, setPersonNumberOnDevice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [otherUniqueIdentificationCode, setOtherUniqueIdentificationCode] = useState('');
  const [cellPhoneNumber, setCellPhoneNumber] = useState('');
  const [fixedTel, setFixedTel] = useState('');
  const [email, setEmail] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [fieldOfStudyId, setFieldOfStudyId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState('');
  const [description, setDescription] = useState('');
  const [additionalDescription, setAdditionalDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<PersonErrorCode | null>(null);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const [personResult, fieldOfStudyResult, positionResult] = await Promise.all([
        getPersonById(id),
        getFieldOfStudies(),
        getPositions(),
      ]);
      setPerson(personResult);
      setFieldOfStudies(fieldOfStudyResult);
      setPositions(positionResult);

      if (personResult) {
        setFirstName(personResult.firstName ?? '');
        setLastName(personResult.lastName ?? '');
        setPersonType(personResult.personType);
        setPersonNumberOnDevice(String(personResult.personNumberOnDevice));
        setStartDate(personResult.startDate);
        setNationalId(personResult.nationalId ?? '');
        setOtherUniqueIdentificationCode(personResult.otherUniqueIdentificationCode ?? '');
        setCellPhoneNumber(personResult.cellPhoneNumber ?? '');
        setFixedTel(personResult.fixedTel ?? '');
        setEmail(personResult.email ?? '');
        setFatherName(personResult.fatherName ?? '');
        setBirthday(personResult.birthday ?? '');
        setFieldOfStudyId(personResult.fieldOfStudyId ?? '');
        setPositionId(personResult.positionId ?? '');
        setAddress(personResult.address ?? '');
        setEmergencyContacts(personResult.emergencyContacts ?? '');
        setDescription(personResult.description ?? '');
        setAdditionalDescription(personResult.additionalDescription ?? '');
      }
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!person) return;
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
      otherUniqueIdentificationCode: otherUniqueIdentificationCode || null,
      cellPhoneNumber: cellPhoneNumber || null,
      fixedTel: fixedTel || null,
      email: email || null,
      address: address || null,
      fatherName: fatherName || null,
      startDate,
      endDate: person.endDate,
      birthday: birthday || null,
      emergencyContacts: emergencyContacts || null,
      additionalDescription: additionalDescription || null,
      isActive: person.isActive,
      fieldOfStudyId: fieldOfStudyId || null,
      positionId: positionId || null,
      inactiveDescription: person.inactiveDescription,
      description: description || null,
      locationIds: null,
      personGroupIds: null,
      hasImage: false,
      imagePath: null,
      isImageChanged: false,
    };

    try {
      await updatePerson(payload);
      navigate(`/persons/${person.id}`);
    } catch (err) {
      setError(err instanceof PersonError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="plain"
          size="sm"
          icon={<HiOutlineArrowLeft />}
          onClick={() => navigate(id ? `/persons/${id}` : '/persons')}
        >
          {t('persons.detail.back')}
        </Button>
        <h1>{t('persons.editTitle')}</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size={28} />
        </div>
      ) : hasError ? (
        <Alert type="danger" className="mb-2">
          <div className="flex items-center justify-between gap-4">
            <span>{t('persons.detail.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('persons.retry')}
            </Button>
          </div>
        </Alert>
      ) : !person ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('persons.detail.notFound')}</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <FormContainer>
            {error && (
              <Alert type="danger" className="mb-4">
                {t(`persons.errors.${error}`)}
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <FormItem label={t('persons.fields.firstName')} htmlFor="editPersonFirstName">
                <Input id="editPersonFirstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </FormItem>
              <FormItem label={t('persons.fields.lastName')} htmlFor="editPersonLastName">
                <Input id="editPersonLastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </FormItem>
              <FormItem label={t('persons.fields.personType')} htmlFor="editPersonType">
                <select
                  id="editPersonType"
                  className="input"
                  value={personType}
                  onChange={(e) => setPersonType(Number(e.target.value) as PersonType)}
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
                  onChange={(e) => setPersonNumberOnDevice(e.target.value)}
                  required
                />
              </FormItem>
              <FormItem label={t('persons.fields.startDate')} htmlFor="editPersonStartDate">
                <Input id="editPersonStartDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </FormItem>
              <FormItem label={t('persons.fields.nationalId')} htmlFor="editPersonNationalId">
                <Input id="editPersonNationalId" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
              </FormItem>

              <FormItem label={t('persons.detail.otherId')} htmlFor="editPersonOtherId">
                <Input
                  id="editPersonOtherId"
                  value={otherUniqueIdentificationCode}
                  onChange={(e) => setOtherUniqueIdentificationCode(e.target.value)}
                />
              </FormItem>
              <FormItem label={t('persons.fields.cellPhoneNumber')} htmlFor="editPersonCellPhone">
                <Input id="editPersonCellPhone" value={cellPhoneNumber} onChange={(e) => setCellPhoneNumber(e.target.value)} />
              </FormItem>
              <FormItem label={t('persons.detail.fixedTel')} htmlFor="editPersonFixedTel">
                <Input id="editPersonFixedTel" value={fixedTel} onChange={(e) => setFixedTel(e.target.value)} />
              </FormItem>

              <FormItem label={t('persons.fields.email')} htmlFor="editPersonEmail">
                <Input id="editPersonEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </FormItem>
              <FormItem label={t('persons.detail.fatherName')} htmlFor="editPersonFatherName">
                <Input id="editPersonFatherName" value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
              </FormItem>
              <FormItem label={t('persons.detail.birthday')} htmlFor="editPersonBirthday">
                <Input id="editPersonBirthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
              </FormItem>

              <FormItem label={t('persons.detail.fieldOfStudy')} htmlFor="editPersonFieldOfStudy">
                <select
                  id="editPersonFieldOfStudy"
                  className="input"
                  value={fieldOfStudyId}
                  onChange={(e) => setFieldOfStudyId(e.target.value)}
                >
                  <option value="">—</option>
                  {fieldOfStudies.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </FormItem>
              <FormItem label={t('persons.detail.position')} htmlFor="editPersonPosition">
                <select id="editPersonPosition" className="input" value={positionId} onChange={(e) => setPositionId(e.target.value)}>
                  <option value="">—</option>
                  {positions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </FormItem>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <FormItem label={t('persons.detail.address')} htmlFor="editPersonAddress">
                <Input id="editPersonAddress" textArea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
              </FormItem>
              <FormItem label={t('persons.detail.emergencyContacts')} htmlFor="editPersonEmergencyContacts">
                <Input
                  id="editPersonEmergencyContacts"
                  textArea
                  rows={2}
                  value={emergencyContacts}
                  onChange={(e) => setEmergencyContacts(e.target.value)}
                />
              </FormItem>
              <FormItem label={t('persons.detail.description')} htmlFor="editPersonDescription">
                <Input id="editPersonDescription" textArea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
              </FormItem>
              <FormItem label={t('persons.detail.additionalDescription')} htmlFor="editPersonAdditionalDescription">
                <Input
                  id="editPersonAdditionalDescription"
                  textArea
                  rows={2}
                  value={additionalDescription}
                  onChange={(e) => setAdditionalDescription(e.target.value)}
                />
              </FormItem>
            </div>

            <Button variant="solid" block type="submit" loading={isSubmitting} className="mt-5">
              {isSubmitting ? t('persons.saving') : t('persons.save')}
            </Button>
          </FormContainer>
        </form>
      )}
    </Card>
  );
}
