import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProfilesCollection } from '../db/collections.js';
import { uploadAvatarImage } from '../services/avatar.service.js';
import { AppError } from '../utils/app-error.js';
import { createFakeProfilesCollection } from './helpers/fake-profiles-collection.js';
import { createAuthTestApp, signUpAndLogIn } from './helpers/auth-flow.js';

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

const AVATAR_URL = 'https://i.ibb.co/abc/avatar.png';
const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const validPng = Buffer.concat([PNG_HEADER, Buffer.alloc(100)]);

let app;
let cookie;

beforeEach(async () => {
  vi.clearAllMocks();
  getProfilesCollection.mockReturnValue(createFakeProfilesCollection());
  uploadAvatarImage.mockResolvedValue(AVATAR_URL);
  app = createAuthTestApp();
  cookie = await signUpAndLogIn(app, 'sam@example.com');
});

function upload(
  file,
  { filename = 'avatar.png', contentType = 'image/png', field = 'avatar' } = {},
) {
  const req = request(app).post('/api/profile/avatar').set('Cookie', cookie);
  return file ? req.attach(field, file, { filename, contentType }) : req;
}

describe('POST /api/profile/avatar', () => {
  it('requires a login', async () => {
    const res = await request(app)
      .post('/api/profile/avatar')
      .attach('avatar', validPng, { filename: 'a.png', contentType: 'image/png' });

    expect(res.status).toBe(401);
    expect(uploadAvatarImage).not.toHaveBeenCalled();
  });

  it('uploads a valid image and saves the link on the profile', async () => {
    const res = await upload(validPng);
    const profile = await request(app).get('/api/profile').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toBe(AVATAR_URL);
    expect(profile.body.avatarUrl).toBe(AVATAR_URL);
    expect(uploadAvatarImage).toHaveBeenCalledOnce();
  });

  it('rejects a request with no image', async () => {
    const res = await upload(null);

    expect(res.status).toBe(400);
    expect(res.body.error.details.avatar).toBeDefined();
  });

  it('rejects a file that only claims to be an image', async () => {
    const res = await upload(Buffer.from('<script>alert(1)</script>'), {
      filename: 'avatar.png',
      contentType: 'image/png',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
    expect(uploadAvatarImage).not.toHaveBeenCalled();
  });

  it('rejects an image over 2 MB', async () => {
    const tooBig = Buffer.concat([PNG_HEADER, Buffer.alloc(2 * 1024 * 1024)]);

    const res = await upload(tooBig);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
    expect(uploadAvatarImage).not.toHaveBeenCalled();
  });

  it('rejects an image sent in the wrong field', async () => {
    const res = await upload(validPng, { field: 'photo' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_UPLOAD');
  });

  it('returns a friendly error and keeps the old avatar when the upload fails', async () => {
    await upload(validPng);
    uploadAvatarImage.mockRejectedValueOnce(
      new AppError(
        500,
        'AVATAR_UPLOAD_FAILED',
        'We could not upload your image. Please try again.',
      ),
    );

    const res = await upload(validPng);
    const profile = await request(app).get('/api/profile').set('Cookie', cookie);

    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe('We could not upload your image. Please try again.');
    expect(profile.body.avatarUrl).toBe(AVATAR_URL);
  });
});
