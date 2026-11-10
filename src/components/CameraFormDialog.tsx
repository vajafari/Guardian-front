import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { saveCamera } from '../api/cameraService';
import { listLocations } from '../api/locationService';
import {
  CameraError,
  type Camera,
  type CameraErrorCode,
  type CameraProducer,
  type CameraTask,
  type ModuleFlag,
} from '../types/camera';
import type { IoType } from '../types/device';
import type { Location } from '../types/location';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface CameraFormDialogProps {
  isOpen: boolean;
  camera: Camera | null;
  onClose: () => void;
  onSaved: () => void;
}

const CAMERA_PRODUCER_OPTIONS: CameraProducer[] = [1, 2, 3];
const CAMERA_TASK_OPTIONS: CameraTask[] = [1, 2, 3];
const IO_TYPE_OPTIONS: IoType[] = [0, 1, 2, 3];
const MODULE_FLAG_VALUES: ModuleFlag[] = [1, 2, 4, 8, 16, 32, 64, 256];

export function CameraFormDialog({ isOpen, camera, onClose, onSaved }: CameraFormDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('554');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [locationId, setLocationId] = useState('');
  const [cameraProducer, setCameraProducer] = useState<CameraProducer>(3);
  const [cameraTask, setCameraTask] = useState<CameraTask>(1);
  const [rtspString, setRtspString] = useState('');
  const [apiBasicAuthUsername, setApiBasicAuthUsername] = useState('');
  const [apiBasicAuthPassword, setApiBasicAuthPassword] = useState('');
  const [moduleFlags, setModuleFlags] = useState<string[]>(['1']);
  const [ioType, setIoType] = useState<IoType>(0);
  const [isActive, setIsActive] = useState(true);

  const [locations, setLocations] = useState<Location[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<CameraErrorCode | null>(null);

  const isEdit = camera !== null;

  const reset = () => {
    setTitle(camera?.title ?? '');
    setIpAddress(camera?.ipAddress ?? '');
    setPort(camera ? String(camera.port) : '554');
    setUserName(camera?.userName ?? '');
    setPassword(camera?.password ?? '');
    setLocationId(camera?.locationId ?? '');
    setCameraProducer(camera?.cameraProducer ?? 3);
    setCameraTask(camera?.cameraTask ?? 1);
    setRtspString(camera?.rtspString ?? '');
    setApiBasicAuthUsername(camera?.apiBasicAuthUsername ?? '');
    setApiBasicAuthPassword(camera?.apiBasicAuthPassword ?? '');
    setModuleFlags(
      camera ? MODULE_FLAG_VALUES.filter((flag) => (camera.moduleId & flag) === flag).map(String) : ['1'],
    );
    setIoType(camera?.ioType ?? 0);
    setIsActive(camera?.isActive ?? true);
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      listLocations().then(setLocations);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, camera]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: camera?.id ?? crypto.randomUUID(),
      title,
      ipAddress,
      port: Number(port),
      userName,
      password,
      locationId,
      cameraProducer,
      cameraTask,
      rtspString: rtspString || null,
      apiBasicAuthUsername: apiBasicAuthUsername || null,
      apiBasicAuthPassword: apiBasicAuthPassword || null,
      cameraSettingsInJson: '{}',
      ioType,
      moduleId: moduleFlags.reduce((mask, flag) => mask | Number(flag), 0),
      isActive,
    };

    try {
      await saveCamera(payload, isEdit);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof CameraError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={760}>
      <h4 className="mb-4">{isEdit ? t('cameras.editTitle') : t('cameras.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`cameras.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('cameras.fields.title')} htmlFor="cameraTitle">
              <Input id="cameraTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </FormItem>
            <FormItem label={t('cameras.fields.ipAddress')} htmlFor="cameraIpAddress">
              <Input
                id="cameraIpAddress"
                value={ipAddress}
                onChange={(event) => setIpAddress(event.target.value)}
                placeholder="192.168.1.100"
                required
              />
            </FormItem>
            <FormItem label={t('cameras.fields.port')} htmlFor="cameraPort">
              <Input id="cameraPort" type="number" value={port} onChange={(event) => setPort(event.target.value)} required />
            </FormItem>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('cameras.fields.userName')} htmlFor="cameraUserName">
              <Input id="cameraUserName" value={userName} onChange={(event) => setUserName(event.target.value)} required />
            </FormItem>
            <FormItem label={t('cameras.fields.password')} htmlFor="cameraPassword">
              <Input id="cameraPassword" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </FormItem>
            <FormItem label={t('cameras.fields.location')} htmlFor="cameraLocation">
              <select id="cameraLocation" className="input" value={locationId} onChange={(event) => setLocationId(event.target.value)} required>
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
            <FormItem label={t('cameras.fields.cameraProducer')} htmlFor="cameraProducer">
              <select
                id="cameraProducer"
                className="input"
                value={cameraProducer}
                onChange={(event) => setCameraProducer(Number(event.target.value) as CameraProducer)}
              >
                {CAMERA_PRODUCER_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`cameras.cameraProducers.${value}`)}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('cameras.fields.cameraTask')} htmlFor="cameraTask">
              <select
                id="cameraTask"
                className="input"
                value={cameraTask}
                onChange={(event) => setCameraTask(Number(event.target.value) as CameraTask)}
              >
                {CAMERA_TASK_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`cameras.cameraTasks.${value}`)}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('cameras.fields.ioType')} htmlFor="cameraIoType">
              <select id="cameraIoType" className="input" value={ioType} onChange={(event) => setIoType(Number(event.target.value) as IoType)}>
                {IO_TYPE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`cameras.ioTypes.${value}`)}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('cameras.fields.rtspString')} htmlFor="cameraRtspString">
              <Input id="cameraRtspString" value={rtspString} onChange={(event) => setRtspString(event.target.value)} />
            </FormItem>
            <FormItem label={t('cameras.fields.apiBasicAuthUsername')} htmlFor="cameraApiBasicAuthUsername">
              <Input
                id="cameraApiBasicAuthUsername"
                value={apiBasicAuthUsername}
                onChange={(event) => setApiBasicAuthUsername(event.target.value)}
              />
            </FormItem>
            <FormItem label={t('cameras.fields.apiBasicAuthPassword')} htmlFor="cameraApiBasicAuthPassword">
              <Input
                id="cameraApiBasicAuthPassword"
                value={apiBasicAuthPassword}
                onChange={(event) => setApiBasicAuthPassword(event.target.value)}
              />
            </FormItem>
          </div>

          <FormItem label={t('cameras.fields.moduleId')} htmlFor="cameraModuleId">
            <MultiSelectDropdown
              id="cameraModuleId"
              options={MODULE_FLAG_VALUES.map((value) => ({ value: String(value), label: t(`cameras.moduleFlags.${value}`) }))}
              selectedValues={moduleFlags}
              onChange={setModuleFlags}
            />
          </FormItem>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none mb-5">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="accent-primary" />
            {t('cameras.fields.isActive')}
          </label>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('cameras.saving') : t('cameras.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
