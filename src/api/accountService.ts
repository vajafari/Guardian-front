import axios, { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { extractErrorCodes } from './errorCodes';
import { API_BASE_URL, ACCOUNT_ENDPOINTS, CAPTCHA_ENDPOINTS } from './config';
import {
  ChangePasswordError,
  type ChangePasswordErrorCode,
  type ChangePasswordPayload,
  type ForceChangePasswordPayload,
} from '../types/account';

function mapChangePasswordError(err: unknown): ChangePasswordError {
  if (!(err instanceof AxiosError)) {
    return new ChangePasswordError('unknown');
  }
  if (!err.response) {
    return new ChangePasswordError('network-error');
  }
  const errorCodes = extractErrorCodes(err.response.data);
  const isBusinessError = errorCodes.length > 0 || err.response.status === 400 || err.response.status === 401;
  if (!isBusinessError) {
    return new ChangePasswordError('unknown');
  }
  // The backend's exact error-code-to-reason mapping (bad captcha vs. bad
  // old password) isn't confirmed — this is a best-effort guess from the
  // response body text rather than a known code.
  const body = JSON.stringify(err.response.data ?? '').toLowerCase();
  const code: ChangePasswordErrorCode = /captcha|securityimage/.test(body)
    ? 'invalid-captcha'
    : 'invalid-old-password';
  return new ChangePasswordError(code);
}

/** The captcha's cidcn session cookie must round-trip with the credentials it was issued under. */
export async function getCaptchaImage(): Promise<Blob> {
  const { data } = await httpClient.get<Blob>(CAPTCHA_ENDPOINTS.image, {
    responseType: 'blob',
    withCredentials: true,
  });
  return data;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  if (!payload.oldPassword.trim() || !payload.newPassword.trim() || !payload.securityImage.trim()) {
    throw new ChangePasswordError('missing-fields');
  }

  try {
    await httpClient.post(ACCOUNT_ENDPOINTS.changePassword, payload, { withCredentials: true });
  } catch (err) {
    throw mapChangePasswordError(err);
  }
}

/**
 * Pre-login flow: no bearer token exists yet, so this hits the API directly
 * rather than via httpClient. `securityImage` isn't required here (unlike
 * `changePassword`) since fetching a captcha pre-login may not even be
 * possible — see `ForceChangePasswordPayload`.
 */
export async function changePasswordOnForceChange(payload: ForceChangePasswordPayload): Promise<void> {
  if (!payload.username.trim() || !payload.oldPassword.trim() || !payload.newPassword.trim()) {
    throw new ChangePasswordError('missing-fields');
  }

  try {
    await axios.post(`${API_BASE_URL}${ACCOUNT_ENDPOINTS.changePasswordOnForceChange}`, payload);
  } catch (err) {
    throw mapChangePasswordError(err);
  }
}
