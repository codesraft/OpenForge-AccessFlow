import { API_URL } from './config';
import { NETWORK_ERROR_MESSAGE, getErrorMessage } from './auth-errors';

// This class represents an error returned by the API. It extends the built-in Error class and adds two additional properties: status and code. The status property holds the HTTP status code of the response, while the code property holds a specific error code returned by the API. This allows for more detailed error handling in the client application, enabling developers to respond appropriately to different types of errors based on their status and code.
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch(path, options = {}) {
  // The body can be a FormData (for file uploads) or a JSON object. If it's a JSON object, we need to stringify it before sending it in the request. If it's a FormData, we leave it as is, because the browser will handle it automatically.
  const isFileUpload = options.body instanceof FormData;
  const hasJsonBody = options.body && !isFileUpload;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      // Without this the browser would not send the session cookie to the server.
      credentials: 'include',
      // The server expects JSON for most requests, so we set the content type here. If the body is a FormData (for file uploads), we don't set it, because the browser will handle it automatically.
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