import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { deleteUser, mapUserGridRow, type UserGridRow } from '../api/userService';
import { USER_ENDPOINTS } from '../api/config';
import type { User } from '../types/user';
import { Alert, Button, Card } from '../components/ui';
import { UserFormDialog } from '../components/UserFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function UsersPage() {
  const { t } = useTranslation();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const openAdd = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const openEdit = (row: UserGridRow) => {
    setEditingUser(mapUserGridRow(row));
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await deleteUser(deletingUser.id);
      setDeletingUser(null);
      gridRef.current?.reload();
    } catch {
      setHasError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('users.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('users.addButton')}
        </Button>
      </div>

      <GridView<UserGridRow>
        ref={gridRef}
        dataUrl={USER_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('users.empty')}
        columns={[
          {
            propertyName: 'Username',
            header: t('users.fields.username'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'FirstName',
            header: t('users.fields.person'),
            sortable: true,
            filterOperator: 'like',
            render: (row) => [row.FirstName, row.LastName].filter(Boolean).join(' ') || '—',
          },
          {
            propertyName: 'UserGroupTitle',
            header: t('users.fields.userGroup'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'IsActive',
            header: t('users.fields.isActive'),
            sortable: true,
            render: (row) => (row.IsActive ? t('persons.detail.yes') : t('persons.detail.no')),
          },
          {
            propertyName: 'IsSystemAdmin',
            header: t('users.fields.isSystemAdmin'),
            sortable: true,
            render: (row) => (row.IsSystemAdmin ? t('persons.detail.yes') : t('persons.detail.no')),
          },
        ]}
        actions={(row) => (
          <>
            <Button variant="plain" size="xs" icon={<HiOutlinePencil />} onClick={() => openEdit(row)} />
            <Button
              variant="plain"
              size="xs"
              icon={<HiOutlineTrash />}
              onClick={() => setDeletingUser(mapUserGridRow(row))}
            />
          </>
        )}
      />

      {hasError && (
        <Alert type="danger" className="mt-2">
          {t('users.loadError')}
        </Alert>
      )}

      <UserFormDialog
        isOpen={isFormOpen}
        user={editingUser}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => gridRef.current?.reload()}
      />

      <ConfirmDialog
        isOpen={!!deletingUser}
        message={t('users.deleteConfirm', { username: deletingUser?.username })}
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingUser(null)}
      />
    </Card>
  );
}
