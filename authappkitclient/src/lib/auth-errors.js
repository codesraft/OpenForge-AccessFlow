const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';
const SERVER_ERROR_MESSAGE = 'Something went wrong on our side. Please try again in a moment.';
const RATE_LIMIT_MESSAGE = 'Too many attempts. Please wait a few minutes and try again.';

// Shown whenever a request never reaches the server (server down, offline, blocked by CORS).
export const NETWORK_ERROR_MESSAGE =
  'We could not reach the server. Check your connection and try again.';

const LINK_EXPIRED_MESSAGE = 'This link is invalid or has expired. Please request a new one.';
const ACCOUNT_EXISTS_MESSAGE = 'An account with this email already exists. Try logging in instead.';
const GOOGLE_FAILED_MESSAGE = 'The sign-in with Google did not complete. Please try again.';

// This object maps specific error codes returned by the API to user-friendly error messages. It covers various scenarios such as signing up, logging in, handling links from emails, session management, rate limiting, file uploads, and signing in with Google. Each error code is associated with a message that can be displayed to the user to provide context about what went wrong and how to resolve it.
const MESSAGES_BY_CODE = {
  // Signing up and logging in
  INVALID_EMAIL_OR_PASSWORD: 'The email or password is not correct.',
  INVALID_PASSWORD: 'That password is not correct.',
  INVALID_EMAIL: 'Enter a valid email address.',
  USER_ALREADY_EXISTS: ACCOUNT_EXISTS_MESSAGE,
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: ACCOUNT_EXISTS_MESSAGE,
  PASSWORD_TOO_SHORT: 'Your password is too short.',
  PASSWORD_TOO_LONG: 'Your password is too long.',
  EMAIL_NOT_VERIFIED: 'Please verify your email before logging in.',
  EMAIL_ALREADY_VERIFIED: 'This email is already verified. You can log in.',

  // Links from emails
  INVALID_TOKEN: LINK_EXPIRED_MESSAGE,
  TOKEN_EXPIRED: LINK_EXPIRED_MESSAGE,

  // Being logged in
  UNAUTHENTICATED: 'Please log in to continue.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  SESSION_NOT_FRESH: 'For your security, please log in again before doing this.',
  SESSION_NOT_OWNED: 'You can only log out your own devices.',

  // Limits and services
  RATE_LIMITED: RATE_LIMIT_MESSAGE,
  EMAIL_SEND_FAILED: 'We could not send the email. Please try again in a moment.',
  FILE_TOO_LARGE: 'That image is too large. Choose one that is 2 MB or smaller.',
  INVALID_FILE_TYPE: 'Only JPEG, PNG or WebP images are allowed.',
  AVATAR_UPLOAD_FAILED: 'We could not upload your photo. Please try again.',
  NETWORK_ERROR: NETWORK_ERROR_MESSAGE,

  // Signing in with Google
  ACCESS_DENIED: 'You cancelled the sign-in with Google.',
  ACCOUNT_NOT_LINKED: 'An account with this email already exists. Log in with your password first.',
  UNABLE_TO_LINK_ACCOUNT:
    'An account with this email already exists. Log in with your password first.',
  UNABLE_TO_GET_USER_INFO: 'We could not get your details from Google. Please try again.',
  FAILED_TO_GET_USER_INFO: 'We could not get your details from Google. Please try again.',
  PROVIDER_NOT_FOUND: 'Sign-in with Google is not available right now.',
  STATE_MISMATCH: GOOGLE_FAILED_MESSAGE,
  INVALID_CODE: GOOGLE_FAILED_MESSAGE,
};

// This function takes an error object and returns the error code, if it exists. It checks for the code in multiple places within the error object, including the top-level code property and a nested error.code property. If no code is found, it returns null. This allows the client to handle errors based on their specific codes, which can be useful for displaying user-friendly messages or taking specific actions based on the type of error encountered.
export function getErrorCode(error) {
  return error?.code ?? error?.error?.code ?? null;
}

// This function takes an error object and returns a user-friendly error message based on the error code or HTTP status. It first checks if the error code exists in the predefined MESSAGES_BY_CODE mapping. If not, it checks the HTTP status code to provide a relevant message for server errors, unauthorized access, forbidden actions, or rate limiting. If none of these conditions are met, it falls back to the error's message or a generic fallback message.
export function getErrorMessage(error) {
  const code = getErrorCode(error)?.toUpperCase();
  if (code && MESSAGES_BY_CODE[code]) return MESSAGES_BY_CODE[code];

  const status = error?.status;
  if (status >= 500) return SERVER_ERROR_MESSAGE;
  if (status === 401) return MESSAGES_BY_CODE.UNAUTHENTICATED;
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 429) return RATE_LIMIT_MESSAGE;

  return error?.message || error?.error?.message || FALLBACK_MESSAGE;
}