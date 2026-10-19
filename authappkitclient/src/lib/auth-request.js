import { NETWORK_ERROR_MESSAGE } from './auth-errors';

const NETWORK_ERROR = { code: 'NETWORK_ERROR', message: NETWORK_ERROR_MESSAGE };

// This function runs an authentication request and handles network errors. If the request fails due to a network issue (e.g., the server is down, the user is offline, or the request is blocked by CORS), it returns a standardized error object with a code of 'NETWORK_ERROR' and a user-friendly message. This allows the application to gracefully handle network failures without crashing or leaving the user in an uncertain state.
export async function runAuthRequest(request) {
  try {
    return await request();
  } catch {
    return { data: null, error: NETWORK_ERROR };
  }
}