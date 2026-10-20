import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthTestApp, signUpAndLogIn, signIn } from './helpers/auth-flow.js';

vi.mock('../utils/env.js', () => import('./helpers/test-env.js'));
vi.mock('../services/email.service.js', () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

let app;

beforeEach(() => {
  vi.clearAllMocks();
  app = createAuthTestApp();
});

const listSessions = (cookie) => request(app).get('/api/auth/list-sessions').set('Cookie', cookie);

// The browser only holds the cookie, so the session token is read back from the session list.
async function currentSessionToken(cookie) {
  const res = await request(app).get('/api/auth/get-session').set('Cookie', cookie);
  return res.body.session.token;
}

describe('listing sessions', () => {
  it('requires a login', async () => {
    const res = await request(app).get('/api/auth/list-sessions');

    expect(res.status).toBe(401);
  });

  it("only returns the user's own sessions", async () => {
    const samPhone = await signUpAndLogIn(app, 'sam@example.com');
    await signIn(app, 'sam@example.com');
    const alexLaptop = await signUpAndLogIn(app, 'alex@example.com');

    const sam = await listSessions(samPhone);
    const alex = await listSessions(alexLaptop);

    expect(sam.body).toHaveLength(2);
    expect(alex.body).toHaveLength(1);
  });
});

describe('revoking a session', () => {
  it('lets a user revoke one of their own other sessions', async () => {
    const laptop = await signUpAndLogIn(app, 'sam@example.com');
    const phone = await signIn(app, 'sam@example.com');

    const res = await request(app)
      .post('/api/auth/revoke-session')
      .set('Cookie', laptop)
      .send({ token: await currentSessionToken(phone) });
    const phoneAfter = await request(app).get('/api/auth/get-session').set('Cookie', phone);

    expect(res.status).toBe(200);
    expect(phoneAfter.body).toBeNull();
  });

  it('returns 403 and keeps the session when it belongs to another user', async () => {
    const sam = await signUpAndLogIn(app, 'sam@example.com');
    const alex = await signUpAndLogIn(app, 'alex@example.com');

    const res = await request(app)
      .post('/api/auth/revoke-session')
      .set('Cookie', alex)
      .send({ token: await currentSessionToken(sam) });
    const samAfter = await request(app).get('/api/auth/get-session').set('Cookie', sam);

    expect(res.status).toBe(403);
    expect(samAfter.body.user.email).toBe('sam@example.com');
  });

  it('answers safely when the session is already revoked', async () => {
    const cookie = await signUpAndLogIn(app, 'sam@example.com');

    const res = await request(app)
      .post('/api/auth/revoke-session')
      .set('Cookie', cookie)
      .send({ token: 'a-token-that-does-not-exist' });

    expect(res.status).toBe(200);
  });
});

describe('logging out other devices', () => {
  it('ends the other sessions but keeps the current one', async () => {
    const laptop = await signUpAndLogIn(app, 'sam@example.com');
    const phone = await signIn(app, 'sam@example.com');

    const res = await request(app).post('/api/auth/revoke-other-sessions').set('Cookie', laptop);
    const laptopAfter = await request(app).get('/api/auth/get-session').set('Cookie', laptop);
    const phoneAfter = await request(app).get('/api/auth/get-session').set('Cookie', phone);

    expect(res.status).toBe(200);
    expect(laptopAfter.body.user.email).toBe('sam@example.com');
    expect(phoneAfter.body).toBeNull();
  });
});
