import axios, { AxiosError } from 'axios';
import { API_BASE_URL, AUTH_ENDPOINTS } from './config';
import { AuthError, type AuthTokenResponse, type LoginCredentials, type LoginResult } from '../types/auth';

function mapAuthError(err: unknown): AuthError {
  if (!(err instanceof AxiosError)) {
    return new AuthError('unknown');
  }
  if (!err.response) {
    return new AuthError('network-error');
  }
  if (err.response.status === 401 || err.response.status === 400) {
    return new AuthError('invalid-credentials');
  }
  return new AuthError('unknown');
}

export async function login({ username, password }: LoginCredentials): Promise<LoginResult> {
  if (!username.trim() || !password.trim()) {
    throw new AuthError('missing-credentials');
  }

  let data: AuthTokenResponse;
  try {
    const response = await axios.post<AuthTokenResponse>(`${API_BASE_URL}${AUTH_ENDPOINTS.token}`, {
      userId: username,
      secret: password,
    });
    data = response.data;
  } catch (err) {
    throw mapAuthError(err);
  }

  if (data.isOtpRequired) {
    // No OTP verification step exists yet — surface this rather than pretending sign-in succeeded.
    throw new AuthError('otp-required');
  }

  return {
    token: data.token,
    refreshToken: data.refreshToken,
    user: { userId: username, entityTitle: data.entityTitle },
  };
}

export async function refreshSession(refreshToken: string): Promise<AuthTokenResponse> {
  const { data } = await axios.post<AuthTokenResponse>(`${API_BASE_URL}${AUTH_ENDPOINTS.refreshToken}`, {
    refreshToken,
  });
  return data;
}

export async function logout(token: string): Promise<void> {
  await axios.post(`${API_BASE_URL}${AUTH_ENDPOINTS.logout}`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
