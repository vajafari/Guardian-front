/** DeviceConnectionModeEnumeration. */
export type ConnectionMode = 1 | 2;

/** IoTypeEnumeration. */
export type IoType = 0 | 1 | 2 | 3;

/**
 * ModuleEnumeration — a [Flags] bitmask. Only the individually-selectable
 * bits are listed here; the `All` sentinel (int.MaxValue) is not a pickable
 * option.
 */
export type ModuleFlag = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 256;

/** TimeZonesEnumeration raw numeric values (e.g. 330 = Tehran, UTC+03:30). */
export type TimeZone = number;

/** Read-only catalog row from GET /api/core/DeviceType/GetAllDeviceTypes. */
export interface DeviceType {
  id: string;
  title: string;
}

/** Row shape from GET /api/core/Device/GetById/{id} and the mapped grid row. */
export interface Device {
  id: string;
  deviceNumber: number;
  deviceTypeId: string;
  locationId: string;
  title: string;
  isActive: boolean;
  serialNumber: string | null;
  devicePassword: string | null;
  connectionMode: ConnectionMode;
  deviceIp: string | null;
  tcpPort: number;
  connectTimeout: number;
  moduleId: number;
  ioType: IoType;
  timeZone: TimeZone;
  deviceDescription: string | null;
}

/** GridViewData row, with joined display titles. */
export interface DeviceFullInfo extends Device {
  deviceTypeTitle: string;
  locationNumber: number;
  locationTitle: string;
}

/** POST /api/core/Device/Save/{editMode} body. ConnectionType is always 1 (Ethernet, the enum's only value). */
export interface DevicePayload {
  id: string;
  deviceNumber: number;
  deviceTypeId: string;
  locationId: string;
  title: string;
  isActive: boolean;
  serialNumber: string | null;
  devicePassword: string | null;
  connectionMode: ConnectionMode;
  connectionType: 1;
  deviceIp: string | null;
  /** NOT NULL in the database — this form doesn't expose per-vendor settings, so always "{}". */
  deviceSettingInJson: string;
  tcpPort: number;
  connectTimeout: number;
  moduleId: number;
  ioType: IoType;
  timeZone: TimeZone;
  deviceDescription: string | null;
}

export type DeviceErrorCode =
  | 'missing-fields'
  | 'number-invalid'
  | 'title-invalid'
  | 'ip-invalid'
  | 'tcp-port-invalid'
  | 'device-type-not-found'
  | 'not-found'
  | 'connection-mode-invalid'
  | 'serial-number-must-be-unique'
  | 'device-limit-reached'
  | 'network-error'
  | 'unknown';

export class DeviceError extends Error {
  code: DeviceErrorCode;

  constructor(code: DeviceErrorCode) {
    super(code);
    this.code = code;
    this.name = 'DeviceError';
  }
}
