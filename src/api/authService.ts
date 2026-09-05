import axios, { AxiosError } from 'axios';
import { API_BASE_URL, AUTH_ENDPOINTS } from './config';
import { extractErrorCodes } from './errorCodes';
import { AuthError, type AuthTokenResponse, type LoginCredentials, type LoginResult } from '../types/auth';

/**
 * Error code the backend reports when the password has expired and must be
 * changed before signing in. Confirmed against the real backend: 1039 is a
 * plain invalid-credentials failure (VerifyUserForLoginAsync ->
 * DoUsernameAndPasswordVerify, CentralAuthComponent.cs:334), while 1009 is
 * the expired-password path (-> VerifyGeneralUserAndPersonAsync,
 * CentralAuthComponent.cs:415) — reproduced by logging in with the correct
 * but expired password.
 */
const PASSWORD_EXPIRED_ERROR_CODE = 1009;

function mapAuthError(err: unknown): AuthError {
  if (!(err instanceof AxiosError)) {
    return new AuthError('unknown');
  }
  if (!err.response) {
    return new AuthError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  if (errorCodes.includes(PASSWORD_EXPIRED_ERROR_CODE)) {
    return new AuthError('password-expired');
  }
  if (errorCodes.length > 0 || err.response.status === 401 || err.response.status === 400) {
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
