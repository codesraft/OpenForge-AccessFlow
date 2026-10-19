import { createAuthClient } from 'better-auth/client';
import { API_URL } from './config';

// This class represents an error returned by the API. It extends the built-in Error class and adds properties for the HTTP status code and a specific error code returned by the API. This allows the client to handle different types of errors in a structured way, providing more context about what went wrong during an API request.
export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: { credentials: 'include' },
});