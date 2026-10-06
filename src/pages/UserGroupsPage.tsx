import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { deleteUserGroup, getUserGroupById, listUserGroups } from '../api/userGroupService';
import { UserGroupError, type UserGroup, type UserGroupFullInfo } from '../types/userGroup';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { UserGroupFormDialog } from '../components/UserGroupFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function UserGroupsPage() {
  const { t } = useTranslation();
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserGroup, setEditingUserGroup] = useState<UserGroupFullInfo | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [deletingUserGroup, setDeletingUserGroup] = useState<UserGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await listUserGroups();
      setUserGroups(result);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditingUserGroup(null);
    setIsFormOpen(true);
  };

  const openEdit = async (userGroup: UserGroup) => {
    setIsLoadingEdit(true);
    try {
      const fullInfo = await getUserGroupById(userGroup.id);
      setEditingUserGroup(fullInfo);
      setIsFormOpen(true);
    } catch {
      setHasError(true);
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingUserGroup) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteUserGroup(deletingUserGroup.id);
      setDeletingUserGroup(null);
      load();
    } catch (err) {
      setDeleteError(err instanceof UserGroupError ? t(`userGroups.errors.${err.code}`) : t('userGroups.errors.unknown'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('userGroups.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} loading={isLoadingEdit} onClick={openAdd}>
          {t('userGroups.addButton')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size={28} />
        </div>
      ) : hasError ? (
        <Alert type="danger" className="mb-2">
          <div className="flex items-center justify-between gap-4">
            <span>{t('userGroups.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('userGroups.retry')}
            </Button>
          </div>
        </Alert>
      ) : userGroups.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('userGroups.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('userGroups.fields.title')}
                </th>
                <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('userGroups.fields.accessType')}
                </th>
                <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('userGroups.fields.maxConcurrentSessions')}
                </th>
                <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('userGroups.fields.userCount')}
                </th>
                <th className="py-2 px-3 text-end font-semibold text-gray-500 dark:text-gray-400" />
              </tr>
            </thead>
            <tbody>
              {userGroups.map((userGroup) => (
                <tr
                  key={userGroup.id}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                >
                  <td className="py-2 px-3">{userGroup.title}</td>
                  <td className="py-2 px-3">{t(`userGroups.accessTypes.${userGroup.accessType}`)}</td>
                  <td className="py-2 px-3">{userGroup.maxConcurrentSessions}</td>
                  <td className="py-2 px-3">{userGroup.userCount}</td>
                  <td className="py-2 px-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="plain" size="xs" icon={<HiOutlinePencil />} onClick={() => openEdit(userGroup)} />
                      <Button
                        variant="plain"
                        size="xs"
                        icon={<HiOutlineTrash />}
                        onClick={() => {
                          setDeleteError(null);
                          setDeletingUserGroup(userGroup);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserGroupFormDialog
        isOpen={isFormOpen}
        userGroup={editingUserGroup}
        onClose={() => setIsFormOpen(false)}
        onSaved={load}
      />

      <ConfirmDialog
        isOpen={!!deletingUserGroup}
        message={t('userGroups.deleteConfirm', { title: deletingUserGroup?.title })}
        error={deleteError}
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingUserGroup(null)}
      />
    </Card>
  );
}
