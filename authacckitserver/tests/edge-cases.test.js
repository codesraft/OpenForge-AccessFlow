import request from 'supertest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendVerificationEmail } from '../services/email.service.js';
import { createAuthTestApp, signUpAndLogIn, signIn, PASSWORD } from './helpers/auth-flow.js';
import { env } from '../utils/env.js';

vi.mock('../utils/env.js', () => import('./helpers/test-env.js'));
vi.mock('../services/email.service.js', () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

const EMAIL = 'sam@example.com';
const ONE_SECOND_MS = 1000;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

let app;

beforeEach(() => {
  vi.clearAllMocks();
  app = createAuthTestApp();
});

afterEach(() => vi.useRealTimers());

function signUp(email = EMAIL) {
  return request(app)
    .post('/api/auth/sign-up/email')
    .set('Origin', env.clientUrl)
    .send({ name: 'Sam', email, password: PASSWORD });
}

async function openLastVerificationLink() {
  const link = new URL(sendVerificationEmail.mock.calls.at(-1)[0].url);
  const res = await request(app).get(link.pathname + link.search);

  return new URL(res.headers.location, env.clientUrl);
}

// Moves a stored expiry into the past instead of waiting for it to happen.
function expire(records) {
  records.forEach((record) => {
    record.expiresAt = new Date(Date.now() - ONE_SECOND_MS);
  });
}

describe('expired sessions', () => {
  it('stop being recognised and cannot reach protected routes', async () => {
    const cookie = await signUpAndLogIn(app, EMAIL);
    expire(app.locals.database.session);

    const session = await request(app).get('/api/auth/get-session').set('Cookie', cookie);
    const profile = await request(app).get('/api/profile').set('Cookie', cookie);

    expect(session.body).toBeNull();
    expect(profile.status).toBe(401);
    expect(profile.body.error.code).toBe('UNAUTHENTICATED');
  });
});

describe('verification links', () => {
  it('are rejected once expired, and the account stays unverified', async () => {
    await signUp();
    // The expiry is signed into the link itself, so the clock moves instead of the database.
    vi.useFakeTimers({ toFake: ['Date'], now: Date.now() + TWO_HOURS_MS });

    const redirect = await openLastVerificationLink();

    expect(redirect.searchParams.get('error')).toBeTruthy();
    expect(app.locals.database.user[0].emailVerified).toBe(false);
    vi.useRealTimers();
    expect(await signIn(app, EMAIL)).toBeUndefined();
  });

  it('can be opened again after the email is verified without breaking the account', async () => {
    await signUp();
    const link = new URL(sendVerificationEmail.mock.calls.at(-1)[0].url);
    await request(app).get(link.pathname + link.search);

    const second = await request(app).get(link.pathname + link.search);

    expect(second.status).toBeLessThan(500);
    expect(app.locals.database.user[0].emailVerified).toBe(true);
    expect(await signIn(app, EMAIL)).toBeDefined();
  });
});

describe('asking for a new verification email', () => {
  it('sends nothing for an address that is already verified', async () => {
    await signUpAndLogIn(app, EMAIL);
    sendVerificationEmail.mockClear();

    const res = await request(app)
      .post('/api/auth/send-verification-email')
      .set('Origin', env.clientUrl)
      .send({ email: EMAIL });

    expect(res.status).toBeLessThan(500);
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('answers the same way for an address that does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/send-verification-email')
      .set('Origin', env.clientUrl)
      .send({ email: 'nobody@example.com' });

    expect(res.status).toBeLessThan(500);
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });
});