import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { getFirstUnusedDeviceNumber, saveDevice } from '../api/deviceService';
import { listDeviceTypes } from '../api/deviceTypeService';
import { listLocations } from '../api/locationService';
import {
  DeviceError,
  type ConnectionMode,
  type Device,
  type DeviceErrorCode,
  type DeviceType,
  type IoType,
  type ModuleFlag,
} from '../types/device';
import type { Location } from '../types/location';
import { DEFAULT_TIME_ZONE, TIME_ZONE_VALUES } from '../data/timeZones';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface DeviceFormDialogProps {
  isOpen: boolean;
  device: Device | null;
  onClose: () => void;
  onSaved: () => void;
}

const CONNECTION_MODE_OPTIONS: ConnectionMode[] = [1, 2];
const IO_TYPE_OPTIONS: IoType[] = [0, 1, 2, 3];
const MODULE_FLAG_VALUES: ModuleFlag[] = [1, 2, 4, 8, 16, 32, 64, 256];

export function DeviceFormDialog({ isOpen, device, onClose, onSaved }: DeviceFormDialogProps) {
  const { t } = useTranslation();
  const [deviceNumber, setDeviceNumber] = useState('');
  const [deviceTypeId, setDeviceTypeId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [title, setTitle] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [devicePassword, setDevicePassword] = useState('');
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>(1);
  const [deviceIp, setDeviceIp] = useState('');
  const [tcpPort, setTcpPort] = useState('4370');
  const [connectTimeout, setConnectTimeout] = useState('5000');
  const [moduleFlags, setModuleFlags] = useState<string[]>(['1']);
  const [ioType, setIoType] = useState<IoType>(0);
  const [timeZone, setTimeZone] = useState(DEFAULT_TIME_ZONE);
  const [isActive, setIsActive] = useState(true);
  const [deviceDescription, setDeviceDescription] = useState('');

  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<DeviceErrorCode | null>(null);

  const isEdit = device !== null;

  const reset = () => {
    setDeviceNumber(device ? String(device.deviceNumber) : '');
    setDeviceTypeId(device?.deviceTypeId ?? '');
    setLocationId(device?.locationId ?? '');
    setTitle(device?.title ?? '');
    setSerialNumber(device?.serialNumber ?? '');
    setDevicePassword(device?.devicePassword ?? '');
    setConnectionMode(device?.connectionMode ?? 1);
    setDeviceIp(device?.deviceIp ?? '');
    setTcpPort(device ? String(device.tcpPort) : '4370');
    setConnectTimeout(device ? String(device.connectTimeout) : '5000');
    setModuleFlags(
      device ? MODULE_FLAG_VALUES.filter((flag) => (device.moduleId & flag) === flag).map(String) : ['1'],
    );
    setIoType(device?.ioType ?? 0);
    setTimeZone(device?.timeZone ?? DEFAULT_TIME_ZONE);
    setIsActive(device?.isActive ?? true);
    setDeviceDescription(device?.deviceDescription ?? '');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      Promise.all([listDeviceTypes(), listLocations()]).then(([deviceTypesResult, locationsResult]) => {
        setDeviceTypes(deviceTypesResult);
        setLocations(locationsResult);
      });
      if (!device) {
        getFirstUnusedDeviceNumber()
          .then((n) => setDeviceNumber(String(n)))
          .catch(() => {
            // Non-critical — the field stays empty and editable if this fails.
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, device]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: device?.id ?? crypto.randomUUID(),
      deviceNumber: Number(deviceNumber),
      deviceTypeId,
      locationId,
      title,
      isActive,
      serialNumber: serialNumber || null,
      devicePassword: devicePassword || null,
      connectionMode,
      connectionType: 1 as const,
      deviceIp: deviceIp || null,
      deviceSettingInJson: '{}',
      tcpPort: Number(tcpPort),
      connectTimeout: Number(connectTimeout),
      moduleId: moduleFlags.reduce((mask, flag) => mask | Number(flag), 0),
      ioType,
      timeZone,
      deviceDescription: deviceDescription || null,
    };

    try {
      await saveDevice(payload, isEdit);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof DeviceError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={760}>
      <h4 className="mb-4">{isEdit ? t('devices.editTitle') : t('devices.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`devices.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('devices.fields.deviceNumber')} htmlFor="deviceNumber">
              <Input
                id="deviceNumber"
                type="number"
                value={deviceNumber}
                onChange={(event) => setDeviceNumber(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('devices.fields.deviceType')} htmlFor="deviceType">
              <select id="deviceType" className="input" value={deviceTypeId} onChange={(event) => setDeviceTypeId(event.target.value)} required>
                <option value="">—</option>
                {deviceTypes.map((deviceType) => (
                  <option key={deviceType.id} value={deviceType.id}>
                    {deviceType.title}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('devices.fields.location')} htmlFor="deviceLocation">
              <select id="deviceLocation" className="input" value={locationId} onChange={(event) => setLocationId(event.target.value)} required>
                <option value="">—</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.title}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('devices.fields.title')} htmlFor="deviceTitle">
              <Input id="deviceTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </FormItem>
            <FormItem label={t('devices.fields.serialNumber')} htmlFor="deviceSerialNumber">
              <Input id="deviceSerialNumber" value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} />
            </FormItem>
            <FormItem label={t('devices.fields.devicePassword')} htmlFor="devicePassword">
              <Input id="devicePassword" value={devicePassword} onChange={(event) => setDevicePassword(event.target.value)} />
            </FormItem>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('devices.fields.connectionMode')} htmlFor="connectionMode">
              <select
                id="connectionMode"
                className="input"
                value={connectionMode}
                onChange={(event) => setConnectionMode(Number(event.target.value) as ConnectionMode)}
              >
                {CONNECTION_MODE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`devices.connectionModes.${value}`)}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('devices.fields.deviceIp')} htmlFor="deviceIp">
              <Input id="deviceIp" value={deviceIp} onChange={(event) => setDeviceIp(event.target.value)} placeholder="192.168.1.201" required />
            </FormItem>
            <FormItem label={t('devices.fields.tcpPort')} htmlFor="tcpPort">
              <Input id="tcpPort" type="number" value={tcpPort} onChange={(event) => setTcpPort(event.target.value)} required />
            </FormItem>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('devices.fields.connectTimeout')} htmlFor="connectTimeout">
              <Input id="connectTimeout" type="number" value={connectTimeout} onChange={(event) => setConnectTimeout(event.target.value)} />
            </FormItem>
            <FormItem label={t('devices.fields.ioType')} htmlFor="ioType">
              <select id="ioType" className="input" value={ioType} onChange={(event) => setIoType(Number(event.target.value) as IoType)}>
                {IO_TYPE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`devices.ioTypes.${value}`)}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('devices.fields.timeZone')} htmlFor="timeZone">
              <select id="timeZone" className="input" value={timeZone} onChange={(event) => setTimeZone(Number(event.target.value))}>
                {TIME_ZONE_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {t(`devices.timeZones.${value}`)}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          <FormItem label={t('devices.fields.moduleId')} htmlFor="moduleId">
            <MultiSelectDropdown
              id="moduleId"
              options={MODULE_FLAG_VALUES.map((value) => ({ value: String(value), label: t(`devices.moduleFlags.${value}`) }))}
              selectedValues={moduleFlags}
              onChange={setModuleFlags}
            />
          </FormItem>

          <FormItem label={t('devices.fields.deviceDescription')} htmlFor="deviceDescription">
            <Input
              id="deviceDescription"
              textArea
              rows={2}
              value={deviceDescription}
              onChange={(event) => setDeviceDescription(event.target.value)}
            />
          </FormItem>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none mb-5">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="accent-primary" />
            {t('devices.fields.isActive')}
          </label>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('devices.saving') : t('devices.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
