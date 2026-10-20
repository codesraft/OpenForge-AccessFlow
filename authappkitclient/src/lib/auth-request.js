import { NETWORK_ERROR_MESSAGE } from './auth-errors';

const NETWORK_ERROR = { code: 'NETWORK_ERROR', message: NETWORK_ERROR_MESSAGE };

// This function wraps an API request and returns a consistent shape for the result. If the request succeeds, it returns { data, error: null }. If it fails (for example, due to a network error), it returns { data: null, error: NETWORK_ERROR }.
export async function runAuthRequest(request) {
  try {
    return await request();
  } catch {
    return { data: null, error: NETWORK_ERROR };
  }
}