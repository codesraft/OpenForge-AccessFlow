import express from 'express';
import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createAuthRateLimiter } from '../middleware/rate-limit.js';
import { errorHandler } from '../middleware/error-handler.js';

const LIMITS = {
  signIn: { windowMs: 60_000, perIp: 4, perEmail: 2 },
  signUp: { windowMs: 60_000, perIp: 2, perEmail: 5 },
  passwordReset: { windowMs: 60_000, perIp: 5, perEmail: 1 },
  verificationEmail: { windowMs: 60_000, perIp: 5, perEmail: 1 },
};

// A stand-in for Better Auth: it answers 401 for a wrong password and 200 otherwise.
function createTestApp() {
  const app = express();
  app.set('trust proxy', true);
  app.use(createAuthRateLimiter(LIMITS));
  app.post('/api/auth/{*splat}', (req, res) => {
    res.status(req.body?.password === 'right' ? 200 : 401).json({});
  });
  app.use(errorHandler);
  return app;
}

const signIn = (app, email, password = 'wrong', ip = '1.1.1.1') =>
  request(app).post('/api/auth/sign-in/email').set('X-Forwarded-For', ip).send({ email, password });

describe('rate limiting', () => {
  it('blocks an email after too many wrong passwords, with the standard error', async () => {
    const app = createTestApp();

    await signIn(app, 'sam@example.com');
    await signIn(app, 'sam@example.com');
    const res = await signIn(app, 'sam@example.com');

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });

  it('still blocks that email when the IP address changes', async () => {
    const app = createTestApp();

    await signIn(app, 'sam@example.com', 'wrong', '1.1.1.1');
    await signIn(app, 'sam@example.com', 'wrong', '2.2.2.2');
    const res = await signIn(app, 'sam@example.com', 'wrong', '3.3.3.3');

    expect(res.status).toBe(429);
  });

  it('treats upper and lower case emails as the same account', async () => {
    const app = createTestApp();

    await signIn(app, 'Sam@Example.com', 'wrong', '1.1.1.1');
    await signIn(app, 'SAM@example.com', 'wrong', '2.2.2.2');
    const res = await signIn(app, 'sam@example.com', 'wrong', '3.3.3.3');

    expect(res.status).toBe(429);
  });

  it('blocks one IP address that tries many different emails', async () => {
    const app = createTestApp();

    for (const name of ['a', 'b', 'c', 'd']) {
      await signIn(app, `${name}@example.com`);
    }
    const res = await signIn(app, 'e@example.com');

    expect(res.status).toBe(429);
  });

  it('does not count successful logins', async () => {
    const app = createTestApp();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const res = await signIn(app, 'sam@example.com', 'right');
      expect(res.status).toBe(200);
    }
  });

  it('limits sign-up and password reset requests too', async () => {
    const app = createTestApp();

    await request(app).post('/api/auth/sign-up/email').send({ email: 'a@example.com' });
    await request(app).post('/api/auth/sign-up/email').send({ email: 'b@example.com' });
    const signUp = await request(app)
      .post('/api/auth/sign-up/email')
      .send({ email: 'c@example.com' });

    await request(app).post('/api/auth/request-password-reset').send({ email: 'sam@example.com' });
    const reset = await request(app)
      .post('/api/auth/request-password-reset')
      .send({ email: 'sam@example.com' });

    expect(signUp.status).toBe(429);
    expect(reset.status).toBe(429);
  });

  it('leaves other auth routes alone', async () => {
    const app = createTestApp();

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const res = await request(app).post('/api/auth/sign-out').send({});
      expect(res.status).toBe(401);
    }
  });

  it('limits resending the verification email, which would otherwise flood an inbox', async () => {
    const app = createTestApp();
    const resend = (ip) =>
      request(app)
        .post('/api/auth/send-verification-email')
        .set('X-Forwarded-For', ip)
        .send({ email: 'sam@example.com' });

    await resend('1.1.1.1');
    const res = await resend('2.2.2.2');

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });
});