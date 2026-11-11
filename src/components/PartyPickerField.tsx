import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addPartyForPerson, addPartyWithTitle, searchActiveParties, searchPartiesByPerson } from '../api/partyService';
import { searchPersonsByFullName } from '../api/personService';
import type { PartyFullInfo } from '../types/party';
import type { PersonSummary } from '../types/person';
import { Button, FormItem, Input } from './ui';

type PartyPickerMode = 'existing' | 'person' | 'vendor';

interface PartyPickerFieldProps {
  isOpen: boolean;
  onResolved: (partyId: string) => void;
}

function personLabel(person: PersonSummary): string {
  return [person.firstName, person.lastName].filter(Boolean).join(' ') || person.id;
}

export function PartyPickerField({ isOpen, onResolved }: PartyPickerFieldProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<PartyPickerMode>('existing');
  const [parties, setParties] = useState<PartyFullInfo[]>([]);
  const [persons, setPersons] = useState<PersonSummary[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [vendorTitle, setVendorTitle] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode('existing');
      setSelectedPartyId('');
      setSelectedPersonId('');
      setVendorTitle('');
      setNote(null);
      onResolved('');
      Promise.all([searchActiveParties(), searchPersonsByFullName('', { itemsPerPage: 500 })]).then(
        ([partiesResult, personsResult]) => {
          setParties(partiesResult);
          setPersons(personsResult);
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleModeChange = (newMode: PartyPickerMode) => {
    setMode(newMode);
    setSelectedPartyId('');
    setSelectedPersonId('');
    setVendorTitle('');
    setNote(null);
    onResolved('');
  };

  const handleExistingPartyChange = (partyId: string) => {
    setSelectedPartyId(partyId);
    onResolved(partyId);
  };

  const handlePersonChange = async (personId: string) => {
    setSelectedPersonId(personId);
    setNote(null);
    onResolved('');
    if (!personId) return;

    setIsResolving(true);
    try {
      const existing = await searchPartiesByPerson(personId);
      if (existing.length > 0) {
        setNote(t('party.existingPartyReused'));
        onResolved(existing[0].id);
      } else {
        const created = await addPartyForPerson(personId);
        setNote(t('party.partyCreated'));
        onResolved(created.id);
      }
    } finally {
      setIsResolving(false);
    }
  };

  const handleCreateVendor = async () => {
    if (!vendorTitle.trim()) return;
    setIsResolving(true);
    try {
      const created = await addPartyWithTitle(vendorTitle.trim());
      setNote(t('party.partyCreated'));
      onResolved(created.id);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <FormItem label={t('party.fieldLabel')} htmlFor="partyPickerExisting">
      <div className="flex items-center gap-4 mb-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="partyPickerMode" checked={mode === 'existing'} onChange={() => handleModeChange('existing')} />
          {t('party.modes.existing')}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="partyPickerMode" checked={mode === 'person'} onChange={() => handleModeChange('person')} />
          {t('party.modes.person')}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="partyPickerMode" checked={mode === 'vendor'} onChange={() => handleModeChange('vendor')} />
          {t('party.modes.vendor')}
        </label>
      </div>

      {mode === 'existing' ? (
        <select
          id="partyPickerExisting"
          className="input"
          value={selectedPartyId}
          onChange={(event) => handleExistingPartyChange(event.target.value)}
          required
        >
          <option value="">—</option>
          {parties.map((party) => (
            <option key={party.id} value={party.id}>
              {party.displayName}
            </option>
          ))}
        </select>
      ) : mode === 'person' ? (
        <select
          id="partyPickerPerson"
          className="input"
          value={selectedPersonId}
          onChange={(event) => handlePersonChange(event.target.value)}
          disabled={isResolving}
          required
        >
          <option value="">—</option>
          {persons.map((person) => (
            <option key={person.id} value={person.id}>
              {personLabel(person)}
            </option>
          ))}
        </select>
      ) : (
        <div className="flex items-center gap-3">
          <Input
            id="partyPickerVendorTitle"
            value={vendorTitle}
            onChange={(event) => setVendorTitle(event.target.value)}
            disabled={isResolving}
          />
          <Button type="button" size="sm" loading={isResolving} disabled={!vendorTitle.trim()} onClick={handleCreateVendor}>
            {t('party.createVendor')}
          </Button>
        </div>
      )}

      {note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{note}</p>}
    </FormItem>
  );
}
