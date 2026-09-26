import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { searchPersonsByFullName } from '../api/personService';
import type { PersonSummary } from '../types/person';
import { Alert, Button, Card, Input, Spinner } from '../components/ui';
import { AddPersonDialog } from '../components/AddPersonDialog';

const SEARCH_DEBOUNCE_MS = 300;

export function PersonsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [persons, setPersons] = useState<PersonSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = async (searchQuery: string, isActive: boolean) => {
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await searchPersonsByFullName(searchQuery, { isActive });
      setPersons(result);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(query, activeOnly);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOnly]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => load(value, activeOnly), SEARCH_DEBOUNCE_MS);
  };

  const fullName = (person: PersonSummary) => [person.firstName, person.lastName].filter(Boolean).join(' ');

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('persons.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={() => setIsAddOpen(true)}>
          {t('persons.addButton')}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
        <Input
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder={t('persons.searchPlaceholder')}
          className="sm:max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(event) => setActiveOnly(event.target.checked)}
            className="accent-primary"
          />
          {t('persons.activeOnly')}
        </label>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size={28} />
        </div>
      ) : hasError ? (
        <Alert type="danger" className="mb-2">
          <div className="flex items-center justify-between gap-4">
            <span>{t('persons.loadError')}</span>
            <Button size="sm" onClick={() => load(query, activeOnly)}>
              {t('persons.retry')}
            </Button>
          </div>
        </Alert>
      ) : persons.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('persons.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('persons.columns.personNumber')}
                </th>
                <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('persons.columns.fullName')}
                </th>
                <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('persons.columns.nationalId')}
                </th>
                <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('persons.columns.otherId')}
                </th>
              </tr>
            </thead>
            <tbody>
              {persons.map((person) => (
                <tr
                  key={person.id}
                  onClick={() => navigate(`/persons/${person.id}`)}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer"
                >
                  <td className="py-2 px-3">{person.personNumberOnDevice}</td>
                  <td className="py-2 px-3">{fullName(person)}</td>
                  <td className="py-2 px-3">{person.nationalId ?? '—'}</td>
                  <td className="py-2 px-3">{person.otherUniqueIdentificationCode ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddPersonDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreated={() => load(query, activeOnly)}
      />
    </Card>
  );
}
