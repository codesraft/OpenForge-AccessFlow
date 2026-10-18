import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { createApp } from '../app.js';
import { createAuth } from '../auth/auth.js';
import { sendVerificationEmail } from '../services/email.service.js';
import { AppError } from '../utils/app-error.js';
import { env } from '../utils/env.js';

vi.mock('../utils/env.js', () => import('./helpers/test-env.js'));

vi.mock('../services/email.service.js', () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

const newUser = { name: 'Test User', email: 'test@example.com', password: 'a-strong-password-1' };

let app;

// The in-memory adapter keeps users and sessions in a plain object, so no database is needed.
beforeEach(() => {
  vi.clearAllMocks();
  const auth = createAuth(memoryAdapter({ user: [], session: [], account: [], verification: [] }));
  app = createApp({ auth });
});

function signUp() {
  return request(app).post('/api/auth/sign-up/email').set('Origin', env.clientUrl).send(newUser);
}

function signIn() {
  return request(app)
    .post('/api/auth/sign-in/email')
    .set('Origin', env.clientUrl)
    .send({ email: newUser.email, password: newUser.password });
}

// Pulls the link out of the email we "sent", the way the user would click it.
function lastVerificationLink() {
  return new URL(sendVerificationEmail.mock.calls.at(-1)[0].url);
}

describe('registration and email verification', () => {
  it('creates the user and sends a verification email', async () => {
    const res = await signUp();

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(newUser.email);
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: newUser.email, name: newUser.name }),
    );
  });

  it('does not log the user in until the email is verified', async () => {
    const res = await signUp();

    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('sends the verification link back to the client, not the server', async () => {
    await signUp();

    expect(lastVerificationLink().searchParams.get('callbackURL')).toBe(`${env.clientUrl}/login`);
  });

  it('rejects login before the email is verified', async () => {
    await signUp();

    const res = await signIn();

    expect(res.status).toBe(403);
  });

  it('allows login after the email is verified', async () => {
    await signUp();
    const link = lastVerificationLink();

    await request(app).get(link.pathname + link.search);
    const res = await signIn();

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects a verification link that was tampered with', async () => {
    await signUp();
    const link = lastVerificationLink();
    link.searchParams.set('token', 'not-a-real-token');

    const res = await request(app).get(link.pathname + link.search);
    const location = res.headers.location ?? '';

    expect(location).toContain('error=');
  });

  it('keeps the account and leaks nothing when the email cannot be sent', async () => {
    sendVerificationEmail.mockRejectedValueOnce(
      new AppError(500, 'EMAIL_SEND_FAILED', 'We could not send the email. Please try again.'),
    );

    const res = await signUp();

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/smtp|stack/i);
  });
});

describe('login attempts', () => {
  it('blocks an email after repeated wrong passwords', async () => {
    const attempt = () =>
      request(app)
        .post('/api/auth/sign-in/email')
        .set('Origin', env.clientUrl)
        .send({ email: newUser.email, password: 'wrong-password-1' });

    for (let count = 0; count < 5; count += 1) {
      expect((await attempt()).status).toBe(401);
    }
    const blocked = await attempt();

    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  });
});

describe('sessions', () => {
  it('returns no session when there is no cookie', async () => {
    const res = await request(app).get('/api/auth/get-session');

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it('recognises the session cookie after login', async () => {
    await signUp();
    const link = lastVerificationLink();
    await request(app).get(link.pathname + link.search);
    const login = await signIn();

    const res = await request(app)
      .get('/api/auth/get-session')
      .set('Cookie', login.headers['set-cookie']);

    expect(res.body.user.email).toBe(newUser.email);
  });
});

describe('configuration', () => {
  it('does not start without a secret', () => {
    const originalSecret = env.authSecret;
    env.authSecret = undefined;

    expect(() => createAuth({})).toThrow('BETTER_AUTH_SECRET is not set');

    env.authSecret = originalSecret;
  });
});