import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { saveUser } from '../api/userService';
import { listUserGroups } from '../api/userGroupService';
import { searchPersonsByFullName } from '../api/personService';
import { UserError, type User, type UserErrorCode } from '../types/user';
import type { UserGroup } from '../types/userGroup';
import type { PersonSummary } from '../types/person';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

/**
 * Unlike every other entity's Add endpoint, /api/core/Account/Save decides Add vs.
 * Update purely by whether `id` is Guid.Empty — there's no separate forceLogout-style
 * flag for it, and a client-generated random id gets treated as an (nonexistent) Update.
 */
const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

interface UserFormDialogProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}

function personLabel(person: PersonSummary): string {
  return [person.firstName, person.lastName].filter(Boolean).join(' ') || person.personNumberOnDevice.toString();
}

export function UserFormDialog({ isOpen, user, onClose, onSaved }: UserFormDialogProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userGroupId, setUserGroupId] = useState('');
  const [personId, setPersonId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [expireDate, setExpireDate] = useState('');

  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [persons, setPersons] = useState<PersonSummary[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<UserErrorCode | null>(null);

  const isEdit = user !== null;

  const reset = () => {
    setUsername(user?.username ?? '');
    setPassword('');
    setUserGroupId(user?.userGroupId ?? '');
    setPersonId(user?.personId ?? '');
    setIsActive(user?.isActive ?? true);
    setIsSystemAdmin(user?.isSystemAdmin ?? false);
    setExpireDate(user?.expireDate?.slice(0, 10) ?? '');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      Promise.all([listUserGroups(), searchPersonsByFullName('', { itemsPerPage: 500 })]).then(
        ([userGroupsResult, personsResult]) => {
          setUserGroups(userGroupsResult);
          setPersons(personsResult);
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: user?.id ?? EMPTY_GUID,
      username,
      password,
      userGroupId,
      personId,
      isActive,
      isSystemAdmin,
      expireDate: expireDate || null,
    };

    try {
      await saveUser(payload, isEdit);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof UserError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={640}>
      <h4 className="mb-4">{isEdit ? t('users.editTitle') : t('users.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`users.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('users.fields.username')} htmlFor="userUsername">
              <Input id="userUsername" value={username} onChange={(event) => setUsername(event.target.value)} required />
            </FormItem>
            <FormItem
              label={isEdit ? t('users.fields.passwordKeepCurrent') : t('users.fields.password')}
              htmlFor="userPassword"
            >
              <Input
                id="userPassword"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required={!isEdit}
              />
            </FormItem>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('users.fields.userGroup')} htmlFor="userUserGroup">
              <select
                id="userUserGroup"
                className="input"
                value={userGroupId}
                onChange={(event) => setUserGroupId(event.target.value)}
                required
              >
                <option value="">—</option>
                {userGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.title}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('users.fields.person')} htmlFor="userPerson">
              <select
                id="userPerson"
                className="input"
                value={personId}
                onChange={(event) => setPersonId(event.target.value)}
                required
              >
                <option value="">—</option>
                {persons.map((person) => (
                  <option key={person.id} value={person.id}>
                    {personLabel(person)}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          <FormItem label={t('users.fields.expireDate')} htmlFor="userExpireDate">
            <Input
              id="userExpireDate"
              type="date"
              value={expireDate}
              onChange={(event) => setExpireDate(event.target.value)}
            />
          </FormItem>

          <div className="flex items-center gap-4 mb-5">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="accent-primary"
              />
              {t('users.fields.isActive')}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none">
              <input
                type="checkbox"
                checked={isSystemAdmin}
                onChange={(event) => setIsSystemAdmin(event.target.checked)}
                className="accent-primary"
              />
              {t('users.fields.isSystemAdmin')}
            </label>
          </div>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('users.saving') : t('users.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
