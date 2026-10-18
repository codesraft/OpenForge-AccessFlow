import request from 'supertest';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { createApp } from '../../app.js';
import { createAuth } from '../../auth/auth.js';
import { sendVerificationEmail } from '../../services/email.service.js';
import { env } from '../../utils/env.js';

export const PASSWORD = 'a-strong-password-1';

// Mocks the environment variables used by the auth middleware. This is necessary because the auth middleware reads these variables when it is created, and we want to control their values for testing.
export function createAuthTestApp() {
  const auth = createAuth(memoryAdapter({ user: [], session: [], account: [], verification: [] }));
  return createApp({ auth });
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