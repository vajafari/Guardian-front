/** Row shape from POST /api/core/DeviceDoorBase/SearchDeviceDoorFullInfo. */
export interface DeviceDoorBase {
  id: string;
  deviceId: string;
  doorNumber: number;
  title: string;
  isActive: boolean;
  /** Always set by this UI — ReaderCameraId is out of scope (no Camera module yet). */
  readerDeviceId: string | null;
  readerCameraId: string | null;
  openDoorDelay: number;
}

/** Full-info row, with joined display titles. */
export interface DeviceDoorBaseFullInfo extends DeviceDoorBase {
  readerDeviceTitle: string | null;
  readerCameraTitle: string | null;
}

/** POST /api/core/DeviceDoorBase/SaveDeviceDoor/{editMode} body. */
export interface DeviceDoorBasePayload {
  id: string;
  deviceId: string;
  doorNumber: number;
  title: string;
  isActive: boolean;
  readerDeviceId: string | null;
  readerCameraId: null;
  openDoorDelay: number;
  deviceSpecificDoorSettingInJson: null;
}

export type DeviceDoorBaseErrorCode =
  | 'missing-fields'
  | 'title-invalid'
  | 'number-invalid'
  | 'number-already-exists'
  | 'reader-invalid'
  | 'not-found'
  | 'network-error'
  | 'unknown';

export class DeviceDoorBaseError extends Error {
  code: DeviceDoorBaseErrorCode;

  constructor(code: DeviceDoorBaseErrorCode) {
    super(code);
    this.code = code;
    this.name = 'DeviceDoorBaseError';
  }
}
