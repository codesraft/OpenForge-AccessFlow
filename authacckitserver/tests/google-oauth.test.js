import request from 'supertest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAuthTestApp, signUpAndLogIn } from './helpers/auth-flow.js';
import { env } from '../utils/env.js';

vi.mock('../utils/env.js', () => import('./helpers/test-env.js'));
vi.mock('../services/email.service.js', () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const AFTER_LOGIN_URL = `${env.clientUrl}/dashboard`;
const ERROR_URL = `${env.clientUrl}/login`;

function toBase64Url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

// Better Auth reads the Google profile from the id token, so a hand-made one is enough.
function fakeGoogleIdToken(email) {
  const profile = { sub: 'google-user-1', email, email_verified: true, name: 'Gina Google' };

  return `${toBase64Url({ alg: 'none' })}.${toBase64Url(profile)}.signature`;
}

function stubGoogleTokenEndpoint(email) {
  const realFetch = globalThis.fetch;

  vi.stubGlobal(
    'fetch',
    vi.fn((url, options) =>
      String(url) === GOOGLE_TOKEN_URL
        ? Promise.resolve(
            Response.json({
              access_token: 'google-access-token',
              id_token: fakeGoogleIdToken(email),
              token_type: 'Bearer',
              expires_in: 3600,
            }),
          )
        : realFetch(url, options),
    ),
  );
}

function startGoogleSignIn(app) {
  return request(app)
    .post('/api/auth/sign-in/social')
    .set('Origin', env.clientUrl)
    .send({ provider: 'google', callbackURL: AFTER_LOGIN_URL, errorCallbackURL: ERROR_URL });
}

// Plays the part of the browser coming back from Google with a code.
function finishGoogleSignIn(app, started) {
  const state = new URL(started.body.url).searchParams.get('state');
  const cookies = started.headers['set-cookie'].map((cookie) => cookie.split(';')[0]);

  return request(app)
    .get('/api/auth/callback/google')
    .query({ code: 'google-auth-code', state })
    .set('Cookie', cookies);
}

let app;

beforeEach(() => {
  vi.clearAllMocks();
  app = createAuthTestApp();
});
afterEach(() => vi.unstubAllGlobals());

describe('starting Google sign-in', () => {
  it('sends the browser to Google and asks Google to come back to the server callback', async () => {
    const res = await startGoogleSignIn(app);
    const googleUrl = new URL(res.body.url);

    expect(res.status).toBe(200);
    expect(googleUrl.origin).toBe('https://accounts.google.com');
    expect(googleUrl.searchParams.get('redirect_uri')).toBe(
      `${env.authUrl}/api/auth/callback/google`,
    );
    expect(googleUrl.searchParams.get('client_id')).toBe(env.googleClientId);
  });
});

describe('coming back from Google', () => {
  it('creates a verified account and a session, then returns the visitor to the client', async () => {
    stubGoogleTokenEndpoint('gina@example.com');

    const res = await finishGoogleSignIn(app, await startGoogleSignIn(app));
    const sessionCookie = (res.headers['set-cookie'] ?? []).find((c) =>
      c.includes('session_token'),
    );

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(AFTER_LOGIN_URL);
    expect(sessionCookie).toBeDefined();
    expect(app.locals.database.user[0]).toMatchObject({
      email: 'gina@example.com',
      emailVerified: true,
    });
  });

  it('does not merge into an existing password account with the same email', async () => {
    await signUpAndLogIn(app, 'gina@example.com');
    stubGoogleTokenEndpoint('gina@example.com');

    const res = await finishGoogleSignIn(app, await startGoogleSignIn(app));
    const location = new URL(res.headers.location);

    expect(`${location.origin}${location.pathname}`).toBe(ERROR_URL);
    expect(location.searchParams.get('error')).toBe('account_not_linked');
    expect(res.headers['set-cookie'] ?? []).not.toContainEqual(
      expect.stringContaining('session_token'),
    );
    expect(app.locals.database.account.filter((a) => a.providerId === 'google')).toHaveLength(0);
  });

  it('sends the visitor back to the login page when Google reports an error', async () => {
    const started = await startGoogleSignIn(app);
    const state = new URL(started.body.url).searchParams.get('state');
    const cookies = started.headers['set-cookie'].map((cookie) => cookie.split(';')[0]);

    const res = await request(app)
      .get('/api/auth/callback/google')
      .query({ error: 'access_denied', state })
      .set('Cookie', cookies);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain(`${ERROR_URL}?error=access_denied`);
  });
});