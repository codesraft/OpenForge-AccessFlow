// Where the Express server lives. The fallback matches the local development setup.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

// Where people go after logging in, and where they are sent when they are not logged in.
export const AFTER_LOGIN_PATH = '/dashboard';
export const LOGIN_PATH = '/login';