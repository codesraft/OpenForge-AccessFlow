import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendPasswordResetEmail } from '../services/email.service.js';
import { createAuthTestApp, signUpAndLogIn, signIn, PASSWORD } from './helpers/auth-flow.js';
import { env } from '../utils/env.js';

vi.mock('../utils/env.js', () => import('./helpers/test-env.js'));
vi.mock('../services/email.service.js', () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

const EMAIL = 'sam@example.com';
const NEW_PASSWORD = 'a-brand-new-password-2';

let app;

beforeEach(() => {
  vi.clearAllMocks();
  app = createAuthTestApp();
});

function requestReset(email) {
  return request(app)
    .post('/api/auth/request-password-reset')
    .set('Origin', env.clientUrl)
    .send({ email });
}

// Opens the emailed link the way a browser would and returns where it redirects to.
async function openLastResetLink() {
  const link = new URL(sendPasswordResetEmail.mock.calls.at(-1)[0].url);
  const res = await request(app).get(link.pathname + link.search);
  return new URL(res.headers.location);
}

function resetPassword(token, newPassword = NEW_PASSWORD) {
  return request(app)
    .post('/api/auth/reset-password')
    .set('Origin', env.clientUrl)
    .send({ token, newPassword });
}

describe('forgot password', () => {
  it('emails a reset link that leads back to the client', async () => {
    await signUpAndLogIn(app, EMAIL);

    const res = await requestReset(EMAIL);
    const redirect = await openLastResetLink();

    expect(res.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.objectContaining({ to: EMAIL }));
    expect(redirect.origin).toBe(env.clientUrl);
    expect(redirect.pathname).toBe('/reset-password');
    expect(redirect.searchParams.get('token')).toBeTruthy();
  });

  it('answers the same way for an unknown email and sends nothing', async () => {
    const res = await requestReset('nobody@example.com');

    expect(res.status).toBe(200);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

describe('reset password', () => {
  it('lets the user log in with the new password and not the old one', async () => {
    await signUpAndLogIn(app, EMAIL);
    await requestReset(EMAIL);
    const token = (await openLastResetLink()).searchParams.get('token');

    const res = await resetPassword(token);

    expect(res.status).toBe(200);
    expect(await signIn(app, EMAIL, NEW_PASSWORD)).toBeDefined();
    expect(await signIn(app, EMAIL, PASSWORD)).toBeUndefined();
  });

  it('only works once', async () => {
    await signUpAndLogIn(app, EMAIL);
    await requestReset(EMAIL);
    const token = (await openLastResetLink()).searchParams.get('token');
    await resetPassword(token);

    const second = await resetPassword(token, 'yet-another-password-3');

    expect(second.status).toBe(400);
    expect(await signIn(app, EMAIL, 'yet-another-password-3')).toBeUndefined();
  });

  it('rejects an expired link', async () => {
    await signUpAndLogIn(app, EMAIL);
    await requestReset(EMAIL);

    // Instead of waiting an hour, move the stored expiry into the past.
    app.locals.database.verification.forEach((record) => {
      record.expiresAt = new Date(Date.now() - 1000);
    });
    const redirect = await openLastResetLink();

    expect(redirect.searchParams.get('error')).toBe('INVALID_TOKEN');
    expect(redirect.searchParams.get('token')).toBeNull();
  });

  it('logs the user out on every device', async () => {
    const laptop = await signUpAndLogIn(app, EMAIL);
    const phone = await signIn(app, EMAIL);
    await requestReset(EMAIL);
    const token = (await openLastResetLink()).searchParams.get('token');

    await resetPassword(token);
    const laptopAfter = await request(app).get('/api/auth/get-session').set('Cookie', laptop);
    const phoneAfter = await request(app).get('/api/auth/get-session').set('Cookie', phone);

    expect(laptopAfter.body).toBeNull();
    expect(phoneAfter.body).toBeNull();
  });
});

describe('change password', () => {
  function changePassword(cookie, body) {
    return request(app)
      .post('/api/auth/change-password')
      .set('Origin', env.clientUrl)
      .set('Cookie', cookie)
      .send(body);
  }

  it('requires the current password', async () => {
    const cookie = await signUpAndLogIn(app, EMAIL);

    const res = await changePassword(cookie, {
      currentPassword: 'not-my-password-1',
      newPassword: NEW_PASSWORD,
    });

    expect(res.status).toBe(400);
    expect(await signIn(app, EMAIL, NEW_PASSWORD)).toBeUndefined();
  });

  it('changes the password when the current one is right', async () => {
    const cookie = await signUpAndLogIn(app, EMAIL);

    const res = await changePassword(cookie, {
      currentPassword: PASSWORD,
      newPassword: NEW_PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(await signIn(app, EMAIL, NEW_PASSWORD)).toBeDefined();
    expect(await signIn(app, EMAIL, PASSWORD)).toBeUndefined();
  });

  it('requires a login', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Origin', env.clientUrl)
      .send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD });

    expect(res.status).toBe(401);
  });
});
