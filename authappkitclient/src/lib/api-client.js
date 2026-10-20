import { API_URL } from './config';
import { NETWORK_ERROR_MESSAGE, getErrorMessage } from './auth-errors';

// Carries the HTTP status and the server's error code, so callers can react to specific failures.
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch(path, options = {}) {
  // FormData sets its own multipart Content-Type (with the boundary), so only JSON bodies get one.
  const isFileUpload = options.body instanceof FormData;
  const hasJsonBody = options.body && !isFileUpload;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      // Without this the browser would not send the session cookie to the server.
      credentials: 'include',
      headers: hasJsonBody
        ? { 'Content-Type': 'application/json', ...options.headers }
        : options.headers,
    });
  } catch {
    // fetch only throws when the request never got an answer.
    throw new ApiError(0, 'NETWORK_ERROR', NETWORK_ERROR_MESSAGE);
  }

  // The body can be empty or not JSON (for example a gateway error), so don't let parsing throw.
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    // Better Auth's own routes answer with { code, message } and no "error" wrapper.
    const error = body?.error ?? body;
    const status = response.status;

    throw new ApiError(
      status,
      error?.code ?? 'UNKNOWN_ERROR',
      getErrorMessage({ status, code: error?.code, message: error?.message }),
    );
  }

  return body;
}
