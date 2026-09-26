import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { getPersonById } from '../api/personService';
import type { PersonFullInfo } from '../types/person';
import { Alert, Button, Card, Spinner } from '../components/ui';

export function PersonDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<PersonFullInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await getPersonById(id);
      setPerson(result);
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

  const fullName = person ? [person.firstName, person.lastName].filter(Boolean).join(' ') : '';

  const fields: Array<{ label: string; value: string }> = person
    ? [
        { label: t('persons.fields.firstName'), value: person.firstName ?? '—' },
        { label: t('persons.fields.lastName'), value: person.lastName ?? '—' },
        { label: t('persons.fields.personType'), value: t('persons.personTypeOption', { value: person.personType }) },
        { label: t('persons.fields.personNumberOnDevice'), value: String(person.personNumberOnDevice) },
        { label: t('persons.fields.startDate'), value: person.startDate },
        { label: t('persons.detail.endDate'), value: person.endDate ?? '—' },
        { label: t('persons.fields.nationalId'), value: person.nationalId ?? '—' },
        { label: t('persons.detail.otherId'), value: person.otherUniqueIdentificationCode ?? '—' },
        { label: t('persons.fields.cellPhoneNumber'), value: person.cellPhoneNumber ?? '—' },
        { label: t('persons.detail.fixedTel'), value: person.fixedTel ?? '—' },
        { label: t('persons.fields.email'), value: person.email ?? '—' },
        { label: t('persons.detail.address'), value: person.address ?? '—' },
        { label: t('persons.detail.fatherName'), value: person.fatherName ?? '—' },
        { label: t('persons.detail.birthday'), value: person.birthday ?? '—' },
        { label: t('persons.detail.fieldOfStudy'), value: person.fieldOfStudyTitle ?? '—' },
        { label: t('persons.detail.position'), value: person.positionTitle ?? '—' },
        { label: t('persons.fields.isActive'), value: person.isActive ? t('persons.detail.yes') : t('persons.detail.no') },
        { label: t('persons.detail.emergencyContacts'), value: person.emergencyContacts ?? '—' },
        { label: t('persons.detail.description'), value: person.description ?? '—' },
        { label: t('persons.detail.additionalDescription'), value: person.additionalDescription ?? '—' },
      ]
    : [];

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <Button variant="plain" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/persons')}>
          {t('persons.detail.back')}
        </Button>
        <h1>{fullName || t('persons.detail.title')}</h1>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          {fields.map((field) => (
            <div key={field.label}>
              <div className="text-xs text-gray-500 dark:text-gray-400">{field.label}</div>
              <div className="text-sm">{field.value}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
