import { API_URL } from './config';
import { NETWORK_ERROR_MESSAGE } from './auth-errors';

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

// This class represents an error returned by the API. It extends the built-in Error class and adds properties for the HTTP status code and a specific error code returned by the API. This allows the client to handle different types of errors in a structured way, providing more context about what went wrong during an API request.
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch(path, options = {}) {
  // FormData is used for file uploads, and the browser sets the content type itself (with a boundary) when sending FormData. If we set the content type to application/json, the server will not be able to parse the request.
  const isFileUpload = options.body instanceof FormData;
  const hasJsonBody = options.body && !isFileUpload;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      // Without this the browser would not send the session cookie to the server.
      credentials: 'include',
      // Only set the content type when there is a body and it is not a file upload. The browser sets the content type itself for file uploads, because it has to add the boundary that separates the parts of the form.
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
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? FALLBACK_MESSAGE,
    );
  }

  return body;
}