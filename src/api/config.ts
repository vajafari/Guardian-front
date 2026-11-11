export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const AUTH_ENDPOINTS = {
  token: '/api/core/Auth/Token',
  refreshToken: '/api/core/Auth/RefreshToken',
  logout: '/api/core/Auth/Logout',
} as const;

export const ACCOUNT_ENDPOINTS = {
  changePassword: '/api/core/Account/ChangePasswordByUser',
  changePasswordOnForceChange: '/api/core/Account/ChangePasswordOnForceChangeByUser',
} as const;

export const CAPTCHA_ENDPOINTS = {
  image: '/api/Captcha/CaptchaImage',
} as const;

export const PERSON_ENDPOINTS = {
  searchSummaryByFullName: (itemsPerPage: number, isActive: 0 | 1) =>
    `/api/core/Person/SearchSummaryByFullName/${itemsPerPage}/${isActive}`,
  add: '/api/core/Person/Add',
  update: '/api/core/Person/Update',
  getFirstUnusedPersonNumberOnDevice: '/api/core/Person/GetFirstUnusedPersonNumberOnDevice',
  getById: '/api/core/Person/GetById',
  activate: '/api/core/Person/PersonActivate',
  inactivate: '/api/core/Person/PersonInactive',
} as const;

export const FIELD_OF_STUDY_ENDPOINTS = {
  getAll: '/api/core/FieldOfStudy/GetAll',
} as const;

export const POSITION_ENDPOINTS = {
  getAll: '/api/core/Position/GetAll',
} as const;

export const FIELD_OF_STUDY_ADMIN_ENDPOINTS = {
  gridView: '/api/core/FieldOfStudy/GridViewData',
  add: '/api/core/FieldOfStudy/Add',
  update: '/api/core/FieldOfStudy/Update',
  delete: (id: string) => `/api/core/FieldOfStudy/Delete/${id}`,
} as const;

export const POSITION_ADMIN_ENDPOINTS = {
  gridView: '/api/core/Position/GridViewData',
  getFirstUnusedNumber: '/api/core/Position/GetFirstUnusedNumber',
  add: '/api/core/Position/Add',
  update: '/api/core/Position/Update',
  delete: (id: string) => `/api/core/Position/Delete/${id}`,
} as const;

export const BUILDING_ENDPOINTS = {
  search: '/api/core/Building/Search',
  getById: (id: string) => `/api/core/Building/GetById/${id}`,
  add: '/api/core/Building/Add',
  update: '/api/core/Building/Update',
  delete: (id: string) => `/api/core/Building/Delete/${id}`,
} as const;

export const BUILDING_FLOOR_ENDPOINTS = {
  getById: (id: string) => `/api/core/BuildingFloor/GetById/${id}`,
  add: '/api/core/BuildingFloor/Add',
  update: '/api/core/BuildingFloor/Update',
  delete: (id: string) => `/api/core/BuildingFloor/Delete/${id}`,
} as const;

export const BUILDING_UNIT_ENDPOINTS = {
  search: '/api/core/BuildingUnit/Search',
  add: '/api/core/BuildingUnit/Add',
  update: '/api/core/BuildingUnit/Update',
  delete: (id: string) => `/api/core/BuildingUnit/Delete/${id}`,
} as const;

export const BUILDING_SPACE_ENDPOINTS = {
  gridView: '/api/core/BuildingSpace/GridView',
  search: '/api/core/BuildingSpace/Search',
  add: '/api/core/BuildingSpace/Add',
  update: '/api/core/BuildingSpace/Update',
  delete: (id: string) => `/api/core/BuildingSpace/Delete/${id}`,
} as const;

export const DEVICE_ENDPOINTS = {
  getFirstUnusedNumber: '/api/core/Device/GetFirstUnusedNumber',
  gridView: '/api/core/Device/GridViewData',
  getById: (id: string) => `/api/core/Device/GetById/${id}`,
  save: (editMode: 0 | 1) => `/api/core/Device/Save/${editMode}`,
  delete: (id: string) => `/api/core/Device/Delete/${id}`,
} as const;

export const CAMERA_ENDPOINTS = {
  gridView: '/api/core/Camera/GridViewData',
  getById: (id: string) => `/api/core/Camera/GetById/${id}`,
  save: (editMode: 0 | 1) => `/api/core/Camera/Save/${editMode}`,
  delete: (id: string) => `/api/core/Camera/Delete/${id}`,
} as const;

export const DEVICE_TYPE_ENDPOINTS = {
  getAll: '/api/core/DeviceType/GetAllDeviceTypes',
} as const;

export const DEVICE_DOOR_BASE_ENDPOINTS = {
  searchFullInfo: '/api/core/DeviceDoorBase/SearchDeviceDoorFullInfo',
  save: (editMode: 0 | 1) => `/api/core/DeviceDoorBase/SaveDeviceDoor/${editMode}`,
  delete: (id: string) => `/api/core/DeviceDoorBase/DeleteDeviceDoor/${id}`,
} as const;

export const ELEVATOR_ENDPOINTS = {
  gridView: '/api/core/Elevator/GridViewData',
  search: '/api/core/Elevator/Search',
  save: (editMode: 0 | 1) => `/api/core/Elevator/Save/${editMode}`,
  delete: (id: string) => `/api/core/Elevator/Delete/${id}`,
  saveElevatorFloorPersons: '/api/core/Elevator/SaveElevatorFloorPersons',
} as const;

export const ELEVATOR_FLOOR_ENDPOINTS = {
  searchFullInfo: '/api/core/ElevatorFloor/SearchFullInfo',
} as const;

export const ELEVATOR_FLOOR_PERSON_ENDPOINTS = {
  searchFullInfo: '/api/core/ElevatorFloorPerson/SearchFullInfo',
} as const;

export const CABINET_ROOM_ENDPOINTS = {
  gridView: '/api/core/CabinetRoom/GridViewData',
  getById: (id: string) => `/api/core/CabinetRoom/GetById/${id}`,
  save: (editMode: 0 | 1) => `/api/core/CabinetRoom/Save/${editMode}`,
  delete: (id: string) => `/api/core/CabinetRoom/Delete/${id}`,
  saveCabinetPersons: '/api/core/CabinetRoom/SaveCabinetPersons',
} as const;

export const PERSON_GROUP_ENDPOINTS = {
  gridView: '/api/core/PersonGroup/GridViewData',
  getById: (id: string) => `/api/core/PersonGroup/GetById/${id}`,
  add: '/api/core/PersonGroup/Add',
  update: '/api/core/PersonGroup/Save',
  delete: (id: string) => `/api/core/PersonGroup/Delete/${id}`,
} as const;

export const CONTRACT_ENDPOINTS = {
  gridView: '/api/core/Contract/GridView',
  getById: (id: string) => `/api/core/Contract/GetById/${id}`,
  aggregateSave: '/api/core/Contract/AggregateSave',
  aggregateUpdate: '/api/core/Contract/AggregateUpdate',
  aggregateDelete: (id: string) => `/api/core/Contract/AggregateDelete/${id}`,
} as const;

export const CONTRACTOR_ENDPOINTS = {
  gridView: '/api/core/Contractor/GridViewData',
  getById: (id: string) => `/api/core/Contractor/GetById/${id}`,
  add: '/api/core/Contractor/Add',
  update: '/api/core/Contractor/Update',
  delete: (id: string) => `/api/core/Contractor/Delete/${id}`,
} as const;

export const CONTRACTOR_CONTRACT_ENDPOINTS = {
  add: '/api/core/ContractorContract/Add',
  update: '/api/core/ContractorContract/Update',
  delete: (id: string) => `/api/core/ContractorContract/Delete/${id}`,
} as const;

export const LOCATION_ENDPOINTS = {
  getAll: '/api/core/Location/GetAll',
  add: '/api/core/Location/Add',
  update: '/api/core/Location/Update',
} as const;

export const USER_GROUP_ENDPOINTS = {
  getAll: '/api/core/UserGroup/GetAll',
  getById: (id: string) => `/api/core/UserGroup/GetById?Id=${id}&E=1&S=1&A=1&C=1&M=1&Ga=1`,
  add: '/api/core/UserGroup/Add',
  update: '/api/core/UserGroup/Save',
  delete: (id: string) => `/api/core/UserGroup/Delete/${id}`,
} as const;

export const USER_ENDPOINTS = {
  gridView: '/api/core/Account/GridViewDataSummary',
  save: (forceLogoutOnUserChange: 0 | 1) => `/api/core/Account/Save/${forceLogoutOnUserChange}`,
  delete: (id: string) => `/api/core/Account/Delete/${id}`,
} as const;

export const FIN_SETUP_ENDPOINTS = {
  quickSetup: '/api/fin/FinSetup/QuickSetup',
  residentUsers: '/api/fin/FinSetup/ResidentUsers',
  menuBundleApply: '/api/fin/FinSetup/MenuBundleApply',
} as const;
