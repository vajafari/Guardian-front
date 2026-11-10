import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { deleteFieldOfStudy, mapFieldOfStudyGridRow, type FieldOfStudyGridRow } from '../api/fieldOfStudyAdminService';
import { FIELD_OF_STUDY_ADMIN_ENDPOINTS } from '../api/config';
import type { FieldOfStudy } from '../types/fieldOfStudy';
import { Alert, Button, Card } from '../components/ui';
import { FieldOfStudyFormDialog } from '../components/FieldOfStudyFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function FieldOfStudiesPage() {
  const { t } = useTranslation();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFieldOfStudy, setEditingFieldOfStudy] = useState<FieldOfStudy | null>(null);
  const [deletingFieldOfStudy, setDeletingFieldOfStudy] = useState<FieldOfStudy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const openAdd = () => {
    setEditingFieldOfStudy(null);
    setIsFormOpen(true);
  };

  const openEdit = (row: FieldOfStudyGridRow) => {
    setEditingFieldOfStudy(mapFieldOfStudyGridRow(row));
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingFieldOfStudy) return;
    setIsDeleting(true);
    try {
      await deleteFieldOfStudy(deletingFieldOfStudy.id);
      setDeletingFieldOfStudy(null);
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
        <h1>{t('fieldOfStudies.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('fieldOfStudies.addButton')}
        </Button>
      </div>

      <GridView<FieldOfStudyGridRow>
        ref={gridRef}
        dataUrl={FIELD_OF_STUDY_ADMIN_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('fieldOfStudies.empty')}
        columns={[
          {
            propertyName: 'Title',
            header: t('fieldOfStudies.fields.title'),
            sortable: true,
            filterOperator: 'like',
          },
        ]}
        actions={(row) => (
          <>
            <Button variant="plain" size="xs" icon={<HiOutlinePencil />} onClick={() => openEdit(row)} />
            <Button
              variant="plain"
              size="xs"
              icon={<HiOutlineTrash />}
              onClick={() => setDeletingFieldOfStudy(mapFieldOfStudyGridRow(row))}
            />
          </>
        )}
      />

      {hasError && (
        <Alert type="danger" className="mt-2">
          {t('fieldOfStudies.loadError')}
        </Alert>
      )}

      <FieldOfStudyFormDialog
        isOpen={isFormOpen}
        fieldOfStudy={editingFieldOfStudy}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => gridRef.current?.reload()}
      />

      <ConfirmDialog
        isOpen={!!deletingFieldOfStudy}
        message={t('fieldOfStudies.deleteConfirm', { title: deletingFieldOfStudy?.title })}
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingFieldOfStudy(null)}
      />
    </Card>
  );
}
