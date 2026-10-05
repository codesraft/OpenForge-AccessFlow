import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';
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