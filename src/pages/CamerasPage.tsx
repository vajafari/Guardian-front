import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { deleteCamera, mapCameraGridRow, type CameraGridRow } from '../api/cameraService';
import { CAMERA_ENDPOINTS } from '../api/config';
import type { CameraFullInfo } from '../types/camera';
import { Alert, Button, Card } from '../components/ui';
import { CameraFormDialog } from '../components/CameraFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function CamerasPage() {
  const { t } = useTranslation();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraFullInfo | null>(null);
  const [deletingCamera, setDeletingCamera] = useState<CameraFullInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const openAdd = () => {
    setEditingCamera(null);
    setIsFormOpen(true);
  };

  const openEdit = (row: CameraGridRow) => {
    setEditingCamera(mapCameraGridRow(row));
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingCamera) return;
    setIsDeleting(true);
    try {
      await deleteCamera(deletingCamera.id);
      setDeletingCamera(null);
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
        <h1>{t('cameras.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('cameras.addButton')}
        </Button>
      </div>

      <GridView<CameraGridRow>
        ref={gridRef}
        dataUrl={CAMERA_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('cameras.empty')}
        columns={[
          {
            propertyName: 'Title',
            header: t('cameras.fields.title'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'IpAddress',
            header: t('cameras.fields.ipAddress'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'Port',
            header: t('cameras.fields.port'),
            sortable: true,
            filterOperator: 'equal',
          },
          {
            propertyName: 'LocationTitle',
            header: t('cameras.fields.location'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'CameraProducer',
            header: t('cameras.fields.cameraProducer'),
            render: (row) => t(`cameras.cameraProducers.${row.CameraProducer}`),
          },
          {
            propertyName: 'CameraTask',
            header: t('cameras.fields.cameraTask'),
            render: (row) => t(`cameras.cameraTasks.${row.CameraTask}`),
          },
          {
            propertyName: 'IsActive',
            header: t('cameras.fields.isActive'),
            sortable: true,
            render: (row) => (row.IsActive ? t('persons.detail.yes') : t('persons.detail.no')),
          },
        ]}
        actions={(row) => (
          <>
            <Button variant="plain" size="xs" icon={<HiOutlinePencil />} onClick={() => openEdit(row)} />
            <Button
              variant="plain"
              size="xs"
              icon={<HiOutlineTrash />}
              onClick={() => setDeletingCamera(mapCameraGridRow(row))}
            />
          </>
        )}
      />

      {hasError && (
        <Alert type="danger" className="mt-2">
          {t('cameras.loadError')}
        </Alert>
      )}

      <CameraFormDialog
        isOpen={isFormOpen}
        camera={editingCamera}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => gridRef.current?.reload()}
      />

      <ConfirmDialog
        isOpen={!!deletingCamera}
        message={t('cameras.deleteConfirm', { title: deletingCamera?.title })}
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingCamera(null)}
      />
    </Card>
  );
}
