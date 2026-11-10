import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { getDeviceById, listAllDevices } from '../api/deviceService';
import { deleteDeviceDoorBase, searchDeviceDoorsByDevice } from '../api/deviceDoorBaseService';
import type { DeviceFullInfo } from '../types/device';
import type { DeviceDoorBaseFullInfo } from '../types/deviceDoorBase';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { DeviceFormDialog } from '../components/DeviceFormDialog';
import { DeviceDoorBaseFormDialog } from '../components/DeviceDoorBaseFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function DeviceDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<DeviceFullInfo | null>(null);
  const [doors, setDoors] = useState<DeviceDoorBaseFullInfo[]>([]);
  const [readerDeviceOptions, setReaderDeviceOptions] = useState<DeviceFullInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDoorFormOpen, setIsDoorFormOpen] = useState(false);
  const [editingDoor, setEditingDoor] = useState<DeviceDoorBaseFullInfo | null>(null);
  const [deletingDoor, setDeletingDoor] = useState<DeviceDoorBaseFullInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const [deviceResult, doorsResult, allDevices] = await Promise.all([
        getDeviceById(id),
        searchDeviceDoorsByDevice(id),
        listAllDevices(),
      ]);
      setDevice(deviceResult);
      setDoors(doorsResult);
      setReaderDeviceOptions(allDevices.filter((candidate) => candidate.id !== id));
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openAddDoor = () => {
    setEditingDoor(null);
    setIsDoorFormOpen(true);
  };

  const openEditDoor = (door: DeviceDoorBaseFullInfo) => {
    setEditingDoor(door);
    setIsDoorFormOpen(true);
  };

  const confirmDeleteDoor = async () => {
    if (!deletingDoor) return;
    setIsDeleting(true);
    try {
      await deleteDeviceDoorBase(deletingDoor.id);
      setDeletingDoor(null);
      load();
    } catch {
      setHasError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const infoFields: Array<{ label: string; value: string }> = device
    ? [
        { label: t('devices.fields.deviceNumber'), value: String(device.deviceNumber) },
        { label: t('devices.fields.deviceType'), value: device.deviceTypeTitle },
        { label: t('devices.fields.location'), value: device.locationTitle },
        { label: t('devices.fields.connectionMode'), value: t(`devices.connectionModes.${device.connectionMode}`) },
        { label: t('devices.fields.deviceIp'), value: device.deviceIp ?? '—' },
        { label: t('devices.fields.tcpPort'), value: String(device.tcpPort) },
        { label: t('devices.fields.serialNumber'), value: device.serialNumber ?? '—' },
        { label: t('devices.fields.isActive'), value: device.isActive ? t('persons.detail.yes') : t('persons.detail.no') },
      ]
    : [];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="plain" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/devices')}>
            {t('devices.detail.back')}
          </Button>
          <h1>{device ? device.title : t('devices.title')}</h1>
        </div>
        {device && (
          <Button size="sm" icon={<HiOutlinePencil />} onClick={() => setIsEditOpen(true)}>
            {t('devices.editTitle')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size={28} />
        </div>
      ) : hasError ? (
        <Alert type="danger" className="mb-2">
          <div className="flex items-center justify-between gap-4">
            <span>{t('devices.detail.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('devices.retry')}
            </Button>
          </div>
        </Alert>
      ) : !device ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('devices.detail.notFound')}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mb-6">
            {infoFields.map((field) => (
              <div key={field.label}>
                <div className="text-xs text-gray-500 dark:text-gray-400">{field.label}</div>
                <div className="text-sm">{field.value}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-3 mt-2">
            <h4>{t('deviceDoors.title')}</h4>
            <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAddDoor}>
              {t('deviceDoors.addButton')}
            </Button>
          </div>

          {doors.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('deviceDoors.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('deviceDoors.fields.doorNumber')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('deviceDoors.fields.title')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('deviceDoors.fields.readerDevice')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('deviceDoors.fields.isActive')}
                    </th>
                    <th className="py-2 px-3 text-end font-semibold text-gray-500 dark:text-gray-400" />
                  </tr>
                </thead>
                <tbody>
                  {doors.map((door) => (
                    <tr
                      key={door.id}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                    >
                      <td className="py-2 px-3">{door.doorNumber}</td>
                      <td className="py-2 px-3">{door.title}</td>
                      <td className="py-2 px-3">{door.readerDeviceTitle ?? '—'}</td>
                      <td className="py-2 px-3">{door.isActive ? t('persons.detail.yes') : t('persons.detail.no')}</td>
                      <td className="py-2 px-3 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="plain" size="xs" icon={<HiOutlinePencil />} onClick={() => openEditDoor(door)} />
                          <Button variant="plain" size="xs" icon={<HiOutlineTrash />} onClick={() => setDeletingDoor(door)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <DeviceFormDialog isOpen={isEditOpen} device={device} onClose={() => setIsEditOpen(false)} onSaved={load} />
          <DeviceDoorBaseFormDialog
            isOpen={isDoorFormOpen}
            deviceId={device.id}
            readerDeviceOptions={readerDeviceOptions}
            door={editingDoor}
            onClose={() => setIsDoorFormOpen(false)}
            onSaved={load}
          />

          <ConfirmDialog
            isOpen={!!deletingDoor}
            message={t('deviceDoors.deleteConfirm', { title: deletingDoor?.title })}
            isConfirming={isDeleting}
            onConfirm={confirmDeleteDoor}
            onClose={() => setDeletingDoor(null)}
          />
        </>
      )}
    </Card>
  );
}
