export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const AUTH_ENDPOINTS = {
  token: '/api/core/Auth/Token',
  refreshToken: '/api/core/Auth/RefreshToken',
  logout: '/api/core/Auth/Logout',
} as const;
