import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { deletePosition, mapPositionGridRow, type PositionGridRow } from '../api/positionAdminService';
import { POSITION_ADMIN_ENDPOINTS } from '../api/config';
import type { Position } from '../types/position';
import { Alert, Button, Card } from '../components/ui';
import { PositionFormDialog } from '../components/PositionFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function PositionsPage() {
  const { t } = useTranslation();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [deletingPosition, setDeletingPosition] = useState<Position | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const openAdd = () => {
    setEditingPosition(null);
    setIsFormOpen(true);
  };

  const openEdit = (row: PositionGridRow) => {
    setEditingPosition(mapPositionGridRow(row));
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingPosition) return;
    setIsDeleting(true);
    try {
      await deletePosition(deletingPosition.id);
      setDeletingPosition(null);
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
        <h1>{t('positions.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('positions.addButton')}
        </Button>
      </div>

      <GridView<PositionGridRow>
        ref={gridRef}
        dataUrl={POSITION_ADMIN_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('positions.empty')}
        columns={[
          {
            propertyName: 'PositionNumber',
            header: t('positions.fields.positionNumber'),
            sortable: true,
            filterOperator: 'equal',
          },
          {
            propertyName: 'Title',
            header: t('positions.fields.title'),
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
              onClick={() => setDeletingPosition(mapPositionGridRow(row))}
            />
          </>
        )}
      />

      {hasError && (
        <Alert type="danger" className="mt-2">
          {t('positions.loadError')}
        </Alert>
      )}

      <PositionFormDialog
        isOpen={isFormOpen}
        position={editingPosition}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => gridRef.current?.reload()}
      />

      <ConfirmDialog
        isOpen={!!deletingPosition}
        message={t('positions.deleteConfirm', { title: deletingPosition?.title })}
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingPosition(null)}
      />
    </Card>
  );
}
