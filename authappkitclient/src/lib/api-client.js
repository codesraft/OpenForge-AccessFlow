import { API_URL } from './config';

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
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    // Without this the browser would not send the session cookie to the server.
    credentials: 'include',
    // The server expects JSON for POST/PUT/PATCH, but GET/DELETE don't have a body.
    headers: options.body
      ? { 'Content-Type': 'application/json', ...options.headers }
      : options.headers,
  });

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