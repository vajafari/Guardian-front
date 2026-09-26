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
  getFirstUnusedPersonNumberOnDevice: '/api/core/Person/GetFirstUnusedPersonNumberOnDevice',
  getById: '/api/core/Person/GetById',
} as const;
