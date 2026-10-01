import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addUserGroup, updateUserGroup } from '../api/userGroupService';
import { searchBuildings } from '../api/buildingService';
import { listLocations } from '../api/locationService';
import { listContractors } from '../api/contractorService';
import { searchPersonsByFullName } from '../api/personService';
import { UserGroupError, type AccessType, type UserGroupErrorCode, type UserGroupFullInfo } from '../types/userGroup';
import type { Building } from '../types/building';
import type { Location } from '../types/location';
import type { Contractor } from '../types/contractor';
import type { PersonSummary } from '../types/person';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface UserGroupFormDialogProps {
  isOpen: boolean;
  userGroup: UserGroupFullInfo | null;
  onClose: () => void;
  onSaved: () => void;
}

const ACCESS_TYPES: AccessType[] = [1, 2, 3, 4];
const SOME_BUILDINGS_AND_PERSONS: AccessType = 4;

function personLabel(person: PersonSummary): string {
  return [person.firstName, person.lastName].filter(Boolean).join(' ') || person.personNumberOnDevice.toString();
}

export function UserGroupFormDialog({ isOpen, userGroup, onClose, onSaved }: UserGroupFormDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [accessType, setAccessType] = useState<AccessType>(SOME_BUILDINGS_AND_PERSONS);
  const [maxConcurrentSessions, setMaxConcurrentSessions] = useState('1');
  const [cidrPrefix, setCidrPrefix] = useState('');
  const [cidrPrefixLength, setCidrPrefixLength] = useState('');
  const [buildingIds, setBuildingIds] = useState<string[]>([]);
  const [personIds, setPersonIds] = useState<string[]>([]);
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [contractorIds, setContractorIds] = useState<string[]>([]);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [persons, setPersons] = useState<PersonSummary[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<UserGroupErrorCode | null>(null);

  const isEdit = userGroup !== null;

  const reset = () => {
    setTitle(userGroup?.title ?? '');
    setAccessType(userGroup?.accessType ?? SOME_BUILDINGS_AND_PERSONS);
    setMaxConcurrentSessions(userGroup ? String(userGroup.maxConcurrentSessions) : '1');
    setCidrPrefix(userGroup?.cidrPrefix ?? '');
    setCidrPrefixLength(userGroup?.cidrPrefixLength ? String(userGroup.cidrPrefixLength) : '');
    setBuildingIds(userGroup?.userGroupBuildings.map((row) => row.buildingId) ?? []);
    setPersonIds(userGroup?.userGroupPersons.map((row) => row.personId) ?? []);
    setLocationIds(userGroup?.userGroupLocations.map((row) => row.locationId) ?? []);
    setContractorIds(userGroup?.userGroupContractors.map((row) => row.contractorId) ?? []);
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      Promise.all([searchBuildings(), listLocations(), listContractors(), searchPersonsByFullName('', { itemsPerPage: 500 })]).then(
        ([buildingsResult, locationsResult, contractorsResult, personsResult]) => {
          setBuildings(buildingsResult);
          setLocations(locationsResult);
          setContractors(contractorsResult);
          setPersons(personsResult);
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userGroup]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const id = userGroup?.id ?? crypto.randomUUID();
    const isSomeBuildingsAndPersons = accessType === SOME_BUILDINGS_AND_PERSONS;

    const payload = {
      id,
      title,
      accessType,
      maxConcurrentSessions: Number(maxConcurrentSessions),
      cidrPrefix: cidrPrefix || null,
      cidrPrefixLength: cidrPrefixLength ? Number(cidrPrefixLength) : null,
      userGroupBuildings: isSomeBuildingsAndPersons
        ? buildingIds.map((buildingId) => ({ userGroupId: id, buildingId }))
        : [],
      userGroupPersons: isSomeBuildingsAndPersons ? personIds.map((personId) => ({ userGroupId: id, personId })) : [],
      userGroupLocations: locationIds.map((locationId) => ({ userGroupId: id, locationId })),
      userGroupContractors: contractorIds.map((contractorId) => ({ userGroupId: id, contractorId })),
      userGroupMenus: [] as [],
      userGroupAccesses: [] as [],
    };

    try {
      if (isEdit) {
        await updateUserGroup(payload);
      } else {
        await addUserGroup(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof UserGroupError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showBuildingsAndPersons = accessType === SOME_BUILDINGS_AND_PERSONS;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={720}>
      <h4 className="mb-4">{isEdit ? t('userGroups.editTitle') : t('userGroups.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`userGroups.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('userGroups.fields.title')} htmlFor="userGroupTitle">
              <Input id="userGroupTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </FormItem>
            <FormItem label={t('userGroups.fields.accessType')} htmlFor="userGroupAccessType">
              <select
                id="userGroupAccessType"
                className="input"
                value={accessType}
                onChange={(event) => setAccessType(Number(event.target.value) as AccessType)}
              >
                {ACCESS_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {t(`userGroups.accessTypes.${value}`)}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('userGroups.fields.maxConcurrentSessions')} htmlFor="userGroupMaxSessions">
              <Input
                id="userGroupMaxSessions"
                type="number"
                min={1}
                value={maxConcurrentSessions}
                onChange={(event) => setMaxConcurrentSessions(event.target.value)}
                required
              />
            </FormItem>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('userGroups.fields.cidrPrefix')} htmlFor="userGroupCidrPrefix">
              <Input
                id="userGroupCidrPrefix"
                value={cidrPrefix}
                onChange={(event) => setCidrPrefix(event.target.value)}
                placeholder="192.168.1.1"
              />
            </FormItem>
            <FormItem label={t('userGroups.fields.cidrPrefixLength')} htmlFor="userGroupCidrPrefixLength">
              <Input
                id="userGroupCidrPrefixLength"
                type="number"
                min={1}
                max={32}
                value={cidrPrefixLength}
                onChange={(event) => setCidrPrefixLength(event.target.value)}
              />
            </FormItem>
          </div>

          <FormItem label={t('userGroups.fields.locations')} htmlFor="userGroupLocations">
            <MultiSelectDropdown
              id="userGroupLocations"
              options={locations.map((location) => ({ value: location.id, label: location.title }))}
              selectedValues={locationIds}
              onChange={setLocationIds}
            />
          </FormItem>

          <FormItem label={t('userGroups.fields.contractors')} htmlFor="userGroupContractors">
            <MultiSelectDropdown
              id="userGroupContractors"
              options={contractors.map((contractor) => ({ value: contractor.id, label: contractor.title }))}
              selectedValues={contractorIds}
              onChange={setContractorIds}
            />
          </FormItem>

          {showBuildingsAndPersons && (
            <>
              <FormItem label={t('userGroups.fields.buildings')} htmlFor="userGroupBuildings">
                <MultiSelectDropdown
                  id="userGroupBuildings"
                  options={buildings.map((building) => ({ value: building.id, label: building.title }))}
                  selectedValues={buildingIds}
                  onChange={setBuildingIds}
                />
              </FormItem>

              <FormItem label={t('userGroups.fields.persons')} htmlFor="userGroupPersons">
                <MultiSelectDropdown
                  id="userGroupPersons"
                  options={persons.map((person) => ({ value: person.id, label: personLabel(person) }))}
                  selectedValues={personIds}
                  onChange={setPersonIds}
                />
              </FormItem>
            </>
          )}

          <Button variant="solid" block type="submit" loading={isSubmitting} className="mt-2">
            {isSubmitting ? t('userGroups.saving') : t('userGroups.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
