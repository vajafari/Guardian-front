import type { IoType, ModuleFlag } from './device';

export type { ModuleFlag };

/** CameraProducerEnumeration. */
export type CameraProducer = 1 | 2 | 3;

/** CameraTaskEnumeration. */
export type CameraTask = 1 | 2 | 3;

/** Row shape from GET /api/core/Camera/GetById/{id} and the mapped grid row. */
export interface Camera {
  id: string;
  title: string;
  ipAddress: string;
  port: number;
  userName: string;
  password: string;
  cameraProducer: CameraProducer;
  cameraTask: CameraTask;
  rtspString: string | null;
  apiBasicAuthUsername: string | null;
  apiBasicAuthPassword: string | null;
  locationId: string;
  ioType: IoType;
  moduleId: number;
  isActive: boolean;
}

/** GridViewData row, with joined display titles. */
export interface CameraFullInfo extends Camera {
  locationNumber: number;
  locationTitle: string;
}

/** POST /api/core/Camera/Save/{editMode} body. */
export interface CameraPayload {
  id: string;
  title: string;
  ipAddress: string;
  port: number;
  userName: string;
  password: string;
  cameraProducer: CameraProducer;
  cameraTask: CameraTask;
  rtspString: string | null;
  apiBasicAuthUsername: string | null;
  apiBasicAuthPassword: string | null;
  /** NOT NULL in the database — this form doesn't expose per-vendor settings, so always "{}". */
  cameraSettingsInJson: string;
  locationId: string;
  ioType: IoType;
  moduleId: number;
  isActive: boolean;
}

export type CameraErrorCode =
  | 'missing-fields'
  | 'title-invalid'
  | 'ip-invalid'
  | 'port-invalid'
  | 'camera-task-invalid'
  | 'location-not-found'
  | 'not-found'
  | 'network-error'
  | 'unknown';

export class CameraError extends Error {
  code: CameraErrorCode;

  constructor(code: CameraErrorCode) {
    super(code);
    this.code = code;
    this.name = 'CameraError';
  }
}
