import express from 'express';
import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { validateBody } from '../middleware/validate.js';
import { errorHandler } from '../middleware/error-handler.js';
import { updateProfileSchema } from '../validators/profile.validator.js';
import { deleteAccountSchema } from '../validators/account.validator.js';

function createTestApp(schema) {
  const app = express();
  app.use(express.json());
  app.post('/test', validateBody(schema), (req, res) => res.json(req.body));
  app.use(errorHandler);
  return app;
}

describe('validateBody', () => {
  it('returns 400 with a message for each invalid field', async () => {
    const res = await request(createTestApp(updateProfileSchema))
      .post('/test')
      .send({ bio: 'x'.repeat(301), avatarUrl: 'not a link' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual({
      bio: 'Bio must be 300 characters or fewer.',
      avatarUrl: 'Avatar must be a valid link.',
    });
  });

  it('requires a name that is not empty', async () => {
    const res = await request(createTestApp(updateProfileSchema))
      .post('/test')
      .send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error.details.name).toBe('Name cannot be empty.');
  });

  it('passes valid data on, trimmed', async () => {
    const res = await request(createTestApp(updateProfileSchema))
      .post('/test')
      .send({ bio: '  Full-stack developer  ' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ bio: 'Full-stack developer' });
  });

  it('rejects fields the schema does not allow', async () => {
    const res = await request(createTestApp(updateProfileSchema))
      .post('/test')
      .send({ userId: 'someone-else' });

    expect(res.status).toBe(400);
  });
});

describe('deleteAccountSchema', () => {
  it('requires the exact confirmation word', async () => {
    const app = createTestApp(deleteAccountSchema);

    const wrong = await request(app).post('/test').send({ confirmation: 'delete' });
    const right = await request(app).post('/test').send({ confirmation: 'DELETE' });

    expect(wrong.status).toBe(400);
    expect(wrong.body.error.details.confirmation).toBe('Type DELETE to confirm.');
    expect(right.status).toBe(200);
  });
});