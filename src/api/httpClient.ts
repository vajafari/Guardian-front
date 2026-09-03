import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, AUTH_ENDPOINTS } from './config';
import { getRefreshToken, getToken, forceSessionExpired, updateTokens } from './tokenStorage';
import type { AuthTokenResponse } from '../types/auth';

/**
 * Authenticated client for calling the backend once signed in. Requests get a
 * Bearer token attached automatically; a 401 triggers a silent token refresh
 * (queueing any requests that fail while the refresh is in flight) and retries
 * the original request once. If the refresh itself fails, the session is
 * cleared and AuthContext is notified via AUTH_SESSION_EXPIRED_EVENT.
 */
export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

httpClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null) {
  for (const { resolve, reject } of pendingQueue) {
    if (token) {
      resolve(token);
    } else {
      reject(error);
    }
  }
  pendingQueue = [];
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      forceSessionExpired();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(httpClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post<AuthTokenResponse>(
        `${API_BASE_URL}${AUTH_ENDPOINTS.refreshToken}`,
        { refreshToken },
      );
      updateTokens(data.token, data.refreshToken);
      flushQueue(null, data.token);
      originalRequest.headers.Authorization = `Bearer ${data.token}`;
      return httpClient(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      forceSessionExpired();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
