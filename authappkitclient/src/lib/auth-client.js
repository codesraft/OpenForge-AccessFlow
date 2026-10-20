import { createAuthClient } from 'better-auth/client';
import { API_URL } from './config';

// Used for Better Auth's own flows (sign in, sign up, Google). credentials: include sends the cookie.
export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: { credentials: 'include' },
});