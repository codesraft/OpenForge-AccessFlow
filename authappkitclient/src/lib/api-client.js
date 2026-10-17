import { API_URL } from './config';

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

// The API always returns JSON, so the client can always parse it and get a structured error.
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
    // The server expects JSON, so the client must send JSON.
    headers: options.body
      ? { 'Content-Type': 'application/json', ...options.headers }
      : options.headers,
  });

  // The body can be empty or not JSON (for example a gateway error), so don't let parsing throw.
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = body?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? FALLBACK_MESSAGE,
    );
  }

  return body;
}