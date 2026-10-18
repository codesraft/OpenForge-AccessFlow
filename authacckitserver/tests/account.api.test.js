import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProfilesCollection } from '../db/collections.js';
import { createFakeProfilesCollection } from './helpers/fake-profiles-collection.js';
import { createAuthTestApp, signUpAndLogIn, signIn } from './helpers/auth-flow.js';

vi.mock('../utils/env.js', () => ({
  env: {
    port: 5000,
    clientUrl: 'http://localhost:3000',
    authUrl: 'http://localhost:5000',
    authSecret: 'a-test-secret-that-is-long-enough-for-better-auth',
  },
}));
vi.mock('../services/email.service.js', () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));
vi.mock('../db/collections.js', () => ({
  COLLECTION_NAMES: { profiles: 'profiles', sessions: 'session', accounts: 'account' },
  getProfilesCollection: vi.fn(),
}));

let app;
let profiles;

beforeEach(() => {
  vi.clearAllMocks();
  profiles = createFakeProfilesCollection();
  getProfilesCollection.mockReturnValue(profiles);
  app = createAuthTestApp();
});

const deleteAccount = (cookie, body = { confirmation: 'DELETE' }) =>
  request(app).delete('/api/account').set('Cookie', cookie).send(body);

describe('DELETE /api/account', () => {
  it('requires a login', async () => {
    const res = await request(app).delete('/api/account').send({ confirmation: 'DELETE' });

    expect(res.status).toBe(401);
  });

  it('refuses to delete without the confirmation word', async () => {
    const cookie = await signUpAndLogIn(app, 'sam@example.com');

    const res = await deleteAccount(cookie, { confirmation: 'yes' });
    const session = await request(app).get('/api/auth/get-session').set('Cookie', cookie);

    expect(res.status).toBe(400);
    expect(session.body.user.email).toBe('sam@example.com');
  });

  it('deletes the account and the profile', async () => {
    const cookie = await signUpAndLogIn(app, 'sam@example.com');
    await request(app).get('/api/profile').set('Cookie', cookie);
    expect(profiles.documents.size).toBe(1);

    const res = await deleteAccount(cookie);

    expect(res.status).toBe(204);
    expect(profiles.documents.size).toBe(0);
  });

  it('makes every existing cookie stop working at once', async () => {
    const laptop = await signUpAndLogIn(app, 'sam@example.com');
    const phone = await signIn(app, 'sam@example.com');

    await deleteAccount(laptop);
    const laptopAfter = await request(app).get('/api/profile').set('Cookie', laptop);
    const phoneAfter = await request(app).get('/api/profile').set('Cookie', phone);

    expect(laptopAfter.status).toBe(401);
    expect(phoneAfter.status).toBe(401);
  });

  it('does not allow logging in again after deletion', async () => {
    const cookie = await signUpAndLogIn(app, 'sam@example.com');
    await deleteAccount(cookie);

    const login = await signIn(app, 'sam@example.com');

    expect(login).toBeUndefined();
  });

  it("leaves other users' accounts alone", async () => {
    const sam = await signUpAndLogIn(app, 'sam@example.com');
    const alex = await signUpAndLogIn(app, 'alex@example.com');

    await deleteAccount(sam);
    const alexProfile = await request(app).get('/api/profile').set('Cookie', alex);

    expect(alexProfile.status).toBe(200);
    expect(alexProfile.body.email).toBe('alex@example.com');
  });
});