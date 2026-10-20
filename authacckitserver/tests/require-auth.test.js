import express from 'express';
import request from 'supertest';
import { describe, it, expect, vi } from 'vitest';
import { createRequireAuth } from '../middleware/require-auth.js';
import { errorHandler } from '../middleware/error-handler.js';

// A fake auth object whose getSession returns whatever the test needs.
function createTestApp(session) {
  const auth = { api: { getSession: vi.fn().mockResolvedValue(session) } };
  const app = express();

  app.get('/private', createRequireAuth(auth), (req, res) => {
    res.json({ email: req.user.email });
  });
  app.use(errorHandler);

  return { app, auth };
}

describe('requireAuth', () => {
  it('rejects a request without a session with 401', async () => {
    const { app } = createTestApp(null);

    const res = await request(app).get('/private');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects a user whose email is not verified with 403', async () => {
    const { app } = createTestApp({ user: { email: 'a@example.com', emailVerified: false } });

    const res = await request(app).get('/private');

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('lets a verified user through and exposes them as req.user', async () => {
    const { app } = createTestApp({
      user: { email: 'a@example.com', emailVerified: true },
      session: { id: 's1' },
    });

    const res = await request(app).get('/private');

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('a@example.com');
  });

  it('passes the request cookie on to the session check', async () => {
    const { app, auth } = createTestApp(null);

    await request(app).get('/private').set('Cookie', 'better-auth.session_token=abc');

    const { headers } = auth.api.getSession.mock.calls[0][0];
    expect(headers.get('cookie')).toBe('better-auth.session_token=abc');
  });
});
