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

export const BUILDING_ENDPOINTS = {
  search: '/api/core/Building/Search',
  getById: (id: string) => `/api/core/Building/GetById/${id}`,
  add: '/api/core/Building/Add',
  update: '/api/core/Building/Update',
  delete: (id: string) => `/api/core/Building/Delete/${id}`,
} as const;

export const BUILDING_FLOOR_ENDPOINTS = {
  add: '/api/core/BuildingFloor/Add',
  update: '/api/core/BuildingFloor/Update',
  delete: (id: string) => `/api/core/BuildingFloor/Delete/${id}`,
} as const;
