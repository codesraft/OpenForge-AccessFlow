import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProfilesCollection } from '../db/collections.js';
import { createFakeProfilesCollection } from './helpers/fake-profiles-collection.js';
import { createAuthTestApp, signUpAndLogIn } from './helpers/auth-flow.js';

vi.mock('../utils/env.js', () => ({
  env: {
    port: 5000,
    clientUrl: 'http://localhost:3000',
    authUrl: 'http://localhost:5000',
    authSecret: 'a-test-secret-that-is-long-enough-for-better-auth',
  },
}));
vi.mock('../services/email.service.js', () => ({ sendVerificationEmail: vi.fn() }));
vi.mock('../db/collections.js', () => ({
  COLLECTION_NAMES: { profiles: 'profiles', sessions: 'session', accounts: 'account' },
  getProfilesCollection: vi.fn(),
}));

let app;

beforeEach(() => {
  vi.clearAllMocks();
  getProfilesCollection.mockReturnValue(createFakeProfilesCollection());
  app = createAuthTestApp();
});

const loginAs = (email) => signUpAndLogIn(app, email);

describe('GET /api/profile', () => {
  it('rejects a request without a session', async () => {
    const res = await request(app).get('/api/profile');

    expect(res.status).toBe(401);
  });

  it('returns the logged-in user their own profile', async () => {
    const cookie = await loginAs('sam@example.com');

    const res = await request(app).get('/api/profile').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'Original Name',
      email: 'sam@example.com',
      avatarUrl: null,
      bio: '',
    });
  });
});

describe('PATCH /api/profile', () => {
  it('updates the name, bio and avatar', async () => {
    const cookie = await loginAs('sam@example.com');

    const res = await request(app).patch('/api/profile').set('Cookie', cookie).send({
      name: 'Sam Rahman',
      bio: 'Full-stack developer',
      avatarUrl: 'https://i.ibb.co/a.png',
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'Sam Rahman',
      bio: 'Full-stack developer',
      avatarUrl: 'https://i.ibb.co/a.png',
    });
  });

  it('keeps the changes on the next request', async () => {
    const cookie = await loginAs('sam@example.com');
    await request(app).patch('/api/profile').set('Cookie', cookie).send({ name: 'Sam Rahman' });

    const res = await request(app).get('/api/profile').set('Cookie', cookie);

    expect(res.body.name).toBe('Sam Rahman');
  });

  it('rejects invalid data with field messages', async () => {
    const cookie = await loginAs('sam@example.com');

    const res = await request(app)
      .patch('/api/profile')
      .set('Cookie', cookie)
      .send({ bio: 'x'.repeat(301) });

    expect(res.status).toBe(400);
    expect(res.body.error.details.bio).toMatch(/300/);
  });

  it('rejects a request without a session', async () => {
    const res = await request(app).patch('/api/profile').send({ bio: 'Hello' });

    expect(res.status).toBe(401);
  });
});

describe('profile ownership', () => {
  it("never shows one user another user's profile", async () => {
    const samCookie = await loginAs('sam@example.com');
    const alexCookie = await loginAs('alex@example.com');
    await request(app).patch('/api/profile').set('Cookie', samCookie).send({ bio: "Sam's bio" });

    const alex = await request(app).get('/api/profile').set('Cookie', alexCookie);

    expect(alex.body.email).toBe('alex@example.com');
    expect(alex.body.bio).toBe('');
  });

  it("cannot change someone else's profile by sending their id", async () => {
    const cookie = await loginAs('sam@example.com');

    const res = await request(app)
      .patch('/api/profile')
      .set('Cookie', cookie)
      .send({ userId: 'another-user', bio: 'Hello' });

    expect(res.status).toBe(400);
  });
});