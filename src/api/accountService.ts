import { AxiosError } from 'axios';
import { httpClient } from './httpClient';
import { ACCOUNT_ENDPOINTS, CAPTCHA_ENDPOINTS } from './config';
import { ChangePasswordError, type ChangePasswordErrorCode, type ChangePasswordPayload } from '../types/account';

function mapChangePasswordError(err: unknown): ChangePasswordError {
  if (!(err instanceof AxiosError)) {
    return new ChangePasswordError('unknown');
  }
  if (!err.response) {
    return new ChangePasswordError('network-error');
  }
  if (err.response.status === 400 || err.response.status === 401) {
    // The backend's exact validation-error shape for a bad captcha vs. a bad
    // old password isn't confirmed — this is a best-effort guess from the
    // response body text rather than a known field/code.
    const body = JSON.stringify(err.response.data ?? '').toLowerCase();
    const code: ChangePasswordErrorCode = /captcha|securityimage/.test(body)
      ? 'invalid-captcha'
      : 'invalid-old-password';
    return new ChangePasswordError(code);
  }
  return new ChangePasswordError('unknown');
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
