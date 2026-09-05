/**
 * This backend reports business-rule failures as `{ errorCodes: number[] }`
 * in the response body — regardless of HTTP status (login failures come
 * back as 500, not 400/401), so status codes alone aren't a reliable signal.
 */
export function extractErrorCodes(data: unknown): number[] {
  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { errorCodes?: unknown }).errorCodes)
  ) {
    return (data as { errorCodes: unknown[] }).errorCodes.filter(
      (code): code is number => typeof code === 'number',
    );
  }
  return [];
}
