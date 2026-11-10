import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { saveDeviceDoorBase } from '../api/deviceDoorBaseService';
import { DeviceDoorBaseError, type DeviceDoorBase, type DeviceDoorBaseErrorCode } from '../types/deviceDoorBase';
import type { Device } from '../types/device';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface DeviceDoorBaseFormDialogProps {
  isOpen: boolean;
  deviceId: string;
  /** Candidate reader devices — every other device, never the door's own device. */
  readerDeviceOptions: Device[];
  door: DeviceDoorBase | null;
  onClose: () => void;
  onSaved: () => void;
}

export function DeviceDoorBaseFormDialog({
  isOpen,
  deviceId,
  readerDeviceOptions,
  door,
  onClose,
  onSaved,
}: DeviceDoorBaseFormDialogProps) {
  const { t } = useTranslation();
  const [doorNumber, setDoorNumber] = useState('');
  const [title, setTitle] = useState('');
  const [readerDeviceId, setReaderDeviceId] = useState('');
  const [openDoorDelay, setOpenDoorDelay] = useState('3');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<DeviceDoorBaseErrorCode | null>(null);

  const isEdit = door !== null;

  const reset = () => {
    setDoorNumber(door ? String(door.doorNumber) : '');
    setTitle(door?.title ?? '');
    setReaderDeviceId(door?.readerDeviceId ?? '');
    setOpenDoorDelay(door ? String(door.openDoorDelay) : '3');
    setIsActive(door?.isActive ?? true);
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, door]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: door?.id ?? crypto.randomUUID(),
      deviceId,
      doorNumber: Number(doorNumber),
      title,
      isActive,
      readerDeviceId: readerDeviceId || null,
      readerCameraId: null,
      openDoorDelay: Number(openDoorDelay),
      deviceSpecificDoorSettingInJson: null,
    };

    try {
      await saveDeviceDoorBase(payload, isEdit);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof DeviceDoorBaseError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={520}>
      <h4 className="mb-4">{isEdit ? t('deviceDoors.editTitle') : t('deviceDoors.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`deviceDoors.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('deviceDoors.fields.doorNumber')} htmlFor="doorNumber">
              <Input id="doorNumber" type="number" value={doorNumber} onChange={(event) => setDoorNumber(event.target.value)} required />
            </FormItem>
            <FormItem label={t('deviceDoors.fields.openDoorDelay')} htmlFor="openDoorDelay">
              <Input
                id="openDoorDelay"
                type="number"
                value={openDoorDelay}
                onChange={(event) => setOpenDoorDelay(event.target.value)}
                required
              />
            </FormItem>
          </div>

          <FormItem label={t('deviceDoors.fields.title')} htmlFor="doorTitle">
            <Input id="doorTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </FormItem>

          <FormItem label={t('deviceDoors.fields.readerDevice')} htmlFor="readerDevice">
            <select
              id="readerDevice"
              className="input"
              value={readerDeviceId}
              onChange={(event) => setReaderDeviceId(event.target.value)}
              required
            >
              <option value="">—</option>
              {readerDeviceOptions.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.title}
                </option>
              ))}
            </select>
          </FormItem>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none mb-5">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="accent-primary" />
            {t('deviceDoors.fields.isActive')}
          </label>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('deviceDoors.saving') : t('deviceDoors.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
