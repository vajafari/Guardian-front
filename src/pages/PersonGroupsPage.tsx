import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import {
  deletePersonGroup,
  getPersonGroupById,
  mapPersonGroupGridRow,
  type PersonGroupGridRow,
} from '../api/personGroupService';
import { PERSON_GROUP_ENDPOINTS } from '../api/config';
import type { PersonGroupDetail, PersonGroupFullInfo } from '../types/personGroup';
import { Alert, Button, Card } from '../components/ui';
import { PersonGroupFormDialog } from '../components/PersonGroupFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function PersonGroupsPage() {
  const { t } = useTranslation();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPersonGroup, setEditingPersonGroup] = useState<PersonGroupDetail | null>(null);
  const [deletingPersonGroup, setDeletingPersonGroup] = useState<PersonGroupFullInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const openAdd = () => {
    setEditingPersonGroup(null);
    setIsFormOpen(true);
  };

  const openEdit = async (row: PersonGroupGridRow) => {
    setHasError(false);
    try {
      const full = await getPersonGroupById(row.Id);
      if (full) {
        setEditingPersonGroup(full);
        setIsFormOpen(true);
      } else {
        setHasError(true);
      }
    } catch {
      setHasError(true);
    }
  };

  const confirmDelete = async () => {
    if (!deletingPersonGroup) return;
    setIsDeleting(true);
    try {
      await deletePersonGroup(deletingPersonGroup.id);
      setDeletingPersonGroup(null);
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
        <h1>{t('personGroups.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('personGroups.addButton')}
        </Button>
      </div>

      <GridView<PersonGroupGridRow>
        ref={gridRef}
        dataUrl={PERSON_GROUP_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('personGroups.empty')}
        columns={[
          {
            propertyName: 'Title',
            header: t('personGroups.fields.title'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'Description',
            header: t('personGroups.fields.description'),
            filterOperator: 'like',
            render: (row) => row.Description || '—',
          },
          {
            propertyName: 'PersonCount',
            header: t('personGroups.fields.personCount'),
            sortable: true,
          },
        ]}
        actions={(row) => (
          <>
            <Button variant="plain" size="xs" icon={<HiOutlinePencil />} onClick={() => openEdit(row)} />
            <Button
              variant="plain"
              size="xs"
              icon={<HiOutlineTrash />}
              onClick={() => setDeletingPersonGroup(mapPersonGroupGridRow(row))}
            />
          </>
        )}
      />

      {hasError && (
        <Alert type="danger" className="mt-2">
          {t('personGroups.loadError')}
        </Alert>
      )}

      <PersonGroupFormDialog
        isOpen={isFormOpen}
        personGroup={editingPersonGroup}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => gridRef.current?.reload()}
      />

      <ConfirmDialog
        isOpen={!!deletingPersonGroup}
        message={t('personGroups.deleteConfirm', { title: deletingPersonGroup?.title })}
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingPersonGroup(null)}
      />
    </Card>
  );
}
