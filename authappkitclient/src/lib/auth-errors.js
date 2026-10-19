const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

// Shown whenever a request never reaches the server (server down, offline, blocked by CORS).
export const NETWORK_ERROR_MESSAGE =
  'We could not reach the server. Check your connection and try again.';

// This class represents an error returned by the API. It extends the built-in Error class and adds properties for the HTTP status code and a specific error code returned by the API. This allows the client to handle different types of errors in a structured way, providing more context about what went wrong during an API request.
export function getErrorMessage(error) {
  return error?.message || error?.error?.message || FALLBACK_MESSAGE;
}

export function getErrorCode(error) {
  return error?.code ?? error?.error?.code ?? null;
}