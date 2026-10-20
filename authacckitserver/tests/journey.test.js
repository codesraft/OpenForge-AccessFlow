import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProfilesCollection } from '../db/collections.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service.js';
import { uploadAvatarImage } from '../services/avatar.service.js';
import { createFakeProfilesCollection } from './helpers/fake-profiles-collection.js';
import { createAuthTestApp, signIn, PASSWORD } from './helpers/auth-flow.js';
import { env } from '../utils/env.js';

vi.mock('../utils/env.js', () => import('./helpers/test-env.js'));
vi.mock('../services/email.service.js', () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));
vi.mock('../services/avatar.service.js', () => ({ uploadAvatarImage: vi.fn() }));
vi.mock('../db/collections.js', () => ({
  COLLECTION_NAMES: { profiles: 'profiles', sessions: 'session', accounts: 'account' },
  getProfilesCollection: vi.fn(),
}));

const EMAIL = 'sam@example.com';
const NEW_PASSWORD = 'a-brand-new-password-2';
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(50),
]);

let app;

beforeEach(() => {
  vi.clearAllMocks();
  getProfilesCollection.mockReturnValue(createFakeProfilesCollection());
  uploadAvatarImage.mockResolvedValue('https://i.ibb.co/abc/avatar.png');
  app = createAuthTestApp();
});

const asBrowser = (method, path, cookie) => {
  const req = request(app)[method](path).set('Origin', env.clientUrl);
  return cookie ? req.set('Cookie', cookie) : req;
};

// Opens a link from an email the way a browser would, and returns where it redirects to.
async function openEmailedLink(mockedSender) {
  const link = new URL(mockedSender.mock.calls.at(-1)[0].url);
  const res = await request(app).get(link.pathname + link.search);
  return new URL(res.headers.location);
}

// Signs in and returns the cookie for the session, or undefined if it fails.
describe('the account lifecycle, from sign-up to deletion', () => {
  it('works from start to finish', async () => {
    // 1. Sign up: the account exists but cannot log in until the email is verified.
    const signUp = await asBrowser('post', '/api/auth/sign-up/email').send({
      name: 'Sam',
      email: EMAIL,
      password: PASSWORD,
    });
    expect(signUp.status).toBe(200);
    expect(sendVerificationEmail).toHaveBeenCalledOnce();
    expect(await signIn(app, EMAIL)).toBeUndefined();

    // 2. Click the link in the email: it leads back to the client, and login now works.
    const verified = await openEmailedLink(sendVerificationEmail);
    expect(verified.origin).toBe(env.clientUrl);
    expect(verified.pathname).toBe('/verify-email');
    const laptop = await signIn(app, EMAIL);
    expect(laptop).toBeDefined();

    // 3. The profile starts empty and can be edited.
    expect((await asBrowser('get', '/api/profile', laptop)).body).toMatchObject({
      name: 'Sam',
      bio: '',
    });
    const edited = await asBrowser('patch', '/api/profile', laptop).send({
      name: 'Sam R.',
      bio: 'Developer',
    });
    expect(edited.body).toMatchObject({ name: 'Sam R.', bio: 'Developer' });

    // 4. A photo can be uploaded and is saved on the profile.
    const avatar = await asBrowser('post', '/api/profile/avatar', laptop).attach('avatar', PNG, {
      filename: 'me.png',
      contentType: 'image/png',
    });
    expect(avatar.body.avatarUrl).toBe('https://i.ibb.co/abc/avatar.png');

    // 5. A second device shows up in the list, and can be logged out from the first one.
    const phone = await signIn(app, EMAIL);
    const sessions = await asBrowser('get', '/api/auth/list-sessions', laptop);
    expect(sessions.body).toHaveLength(2);
    const phoneToken = (await asBrowser('get', '/api/auth/get-session', phone)).body.session.token;
    await asBrowser('post', '/api/auth/revoke-session', laptop).send({ token: phoneToken });
    expect((await asBrowser('get', '/api/profile', phone)).status).toBe(401);

    // 6. Changing the password: the old one stops working and the new one works.
    const changed = await asBrowser('post', '/api/auth/change-password', laptop).send({
      currentPassword: PASSWORD,
      newPassword: NEW_PASSWORD,
    });
    expect(changed.status).toBe(200);
    expect(await signIn(app, EMAIL, PASSWORD)).toBeUndefined();
    expect(await signIn(app, EMAIL, NEW_PASSWORD)).toBeDefined();

    // 7. Forgetting the password: the emailed link sets a new one and logs everything out.
    const afterChange = await signIn(app, EMAIL, NEW_PASSWORD);
    await asBrowser('post', '/api/auth/request-password-reset').send({ email: EMAIL });
    const resetPage = await openEmailedLink(sendPasswordResetEmail);
    expect(resetPage.origin).toBe(env.clientUrl);
    const reset = await asBrowser('post', '/api/auth/reset-password').send({
      token: resetPage.searchParams.get('token'),
      newPassword: PASSWORD,
    });
    expect(reset.status).toBe(200);
    expect((await asBrowser('get', '/api/profile', afterChange)).status).toBe(401);

    // 8. Deleting the account removes everything: the cookie, the profile and the login.
    const lastSession = await signIn(app, EMAIL, PASSWORD);
    const deleted = await asBrowser('delete', '/api/account', lastSession).send({
      confirmation: 'DELETE',
    });
    expect(deleted.status).toBe(204);
    expect((await asBrowser('get', '/api/profile', lastSession)).status).toBe(401);
    expect(await signIn(app, EMAIL, PASSWORD)).toBeUndefined();
  });
});
