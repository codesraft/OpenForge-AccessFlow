import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../create-app.js';
import { env } from '../utils/env.js';

const app = createApp();

describe('health check', () => {
  it('responds with status ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('CORS', () => {
  it('allows the client origin and its cookies', async () => {
    const res = await request(app).get('/api/health').set('Origin', env.clientUrl);

    expect(res.headers['access-control-allow-origin']).toBe(env.clientUrl);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not grant access to any other origin', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://evil.example');

    expect(res.headers['access-control-allow-origin']).not.toBe('https://evil.example');
  });
});

describe('error handling', () => {
  it('returns the standard error format for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' },
    });
  });

  it('returns 400 for a malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{ not json');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});