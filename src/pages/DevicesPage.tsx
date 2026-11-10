import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { deleteDevice, mapDeviceGridRow, type DeviceGridRow } from '../api/deviceService';
import { DEVICE_ENDPOINTS } from '../api/config';
import type { DeviceFullInfo } from '../types/device';
import { Alert, Button, Card } from '../components/ui';
import { DeviceFormDialog } from '../components/DeviceFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function DevicesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceFullInfo | null>(null);
  const [deletingDevice, setDeletingDevice] = useState<DeviceFullInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const openAdd = () => {
    setEditingDevice(null);
    setIsFormOpen(true);
  };

  const openEdit = (row: DeviceGridRow) => {
    setEditingDevice(mapDeviceGridRow(row));
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingDevice) return;
    setIsDeleting(true);
    try {
      await deleteDevice(deletingDevice.id);
      setDeletingDevice(null);
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
        <h1>{t('devices.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('devices.addButton')}
        </Button>
      </div>

      <GridView<DeviceGridRow>
        ref={gridRef}
        dataUrl={DEVICE_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('devices.empty')}
        onRowClick={(row) => navigate(`/devices/${row.Id}`)}
        columns={[
          {
            propertyName: 'Title',
            header: t('devices.fields.title'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'DeviceNumber',
            header: t('devices.fields.deviceNumber'),
            sortable: true,
            filterOperator: 'equal',
          },
          {
            propertyName: 'DeviceTypeTitle',
            header: t('devices.fields.deviceType'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'LocationTitle',
            header: t('devices.fields.location'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'ConnectionMode',
            header: t('devices.fields.connectionMode'),
            render: (row) => t(`devices.connectionModes.${row.ConnectionMode}`),
          },
          {
            propertyName: 'IsActive',
            header: t('devices.fields.isActive'),
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
              onClick={() => setDeletingDevice(mapDeviceGridRow(row))}
            />
          </>
        )}
      />

      {hasError && (
        <Alert type="danger" className="mt-2">
          {t('devices.loadError')}
        </Alert>
      )}

      <DeviceFormDialog
        isOpen={isFormOpen}
        device={editingDevice}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => gridRef.current?.reload()}
      />

      <ConfirmDialog
        isOpen={!!deletingDevice}
        message={t('devices.deleteConfirm', { title: deletingDevice?.title })}
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingDevice(null)}
      />
    </Card>
  );
}
