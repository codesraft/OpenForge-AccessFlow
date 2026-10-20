const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';
const SERVER_ERROR_MESSAGE = 'Something went wrong on our side. Please try again in a moment.';
const RATE_LIMIT_MESSAGE = 'Too many attempts. Please wait a few minutes and try again.';

// Shown whenever a request never reaches the server (server down, offline, blocked by CORS).
export const NETWORK_ERROR_MESSAGE =
  'We could not reach the server. Check your connection and try again.';

const LINK_EXPIRED_MESSAGE = 'This link is invalid or has expired. Please request a new one.';
const ACCOUNT_EXISTS_MESSAGE = 'An account with this email already exists. Try logging in instead.';
const GOOGLE_FAILED_MESSAGE = 'The sign-in with Google did not complete. Please try again.';

// Server error codes mapped to messages that tell the user what to do next.
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

// Better Auth and our own API put the code in different places, so both are checked.
export function getErrorCode(error) {
  return error?.code ?? error?.error?.code ?? null;
}

// Falls back from the specific code, to the HTTP status, to a generic message. Raw server text
// is only used as a last resort.
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
