import request from 'supertest';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { createApp } from '../../app.js';
import { createAuth } from '../../auth/auth.js';
import { sendVerificationEmail } from '../../services/email.service.js';
import { env } from '../../utils/env.js';

export const PASSWORD = 'a-strong-password-1';

// Creates a test app with an in-memory database and the Better Auth instance. The app is used to test the authentication flow, including sign-up, email verification, and sign-in. The in-memory database allows for isolated tests without affecting a real database. The auth instance is created with the in-memory adapter and the server's configuration, including the secret, base URL, trusted origins, cookie settings, and hooks for session ownership checks.
export function createAuthTestApp() {
  const database = { user: [], session: [], account: [], verification: [] };
  const app = createApp({ auth: createAuth(memoryAdapter(database)) });

  app.locals.database = database;
  return app;
}

export async function signIn(app, email, password = PASSWORD) {
  const res = await request(app)
    .post('/api/auth/sign-in/email')
    .set('Origin', env.clientUrl)
    .send({ email, password });

  return res.headers['set-cookie'];
}

// Logs in a user by signing them up, verifying their email, and signing them in. Returns the session cookie to use in subsequent requests. The email verification link is intercepted by the mocked sendVerificationEmail function, so no real email is sent.
export async function signUpAndLogIn(app, email) {
  await request(app)
    .post('/api/auth/sign-up/email')
    .set('Origin', env.clientUrl)
    .send({ name: 'Original Name', email, password: PASSWORD });

  const link = new URL(sendVerificationEmail.mock.calls.at(-1)[0].url);
  await request(app).get(link.pathname + link.search);

  return signIn(app, email);
}
