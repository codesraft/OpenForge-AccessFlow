import express from 'express';
import request from 'supertest';
import { describe, it, expect, vi } from 'vitest';
import { errorHandler } from '../middleware/error-handler.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';

// A tiny app with routes that fail on purpose, so we can check how errors reach the client.
function createFailingApp() {
  const app = express();

  app.get('/forbidden', () => {
    throw new AppError(403, 'FORBIDDEN', 'You cannot access this resource.');
  });

  app.get('/crash', () => {
    throw new Error('connection string mongodb://user:secret@host failed');
  });

  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('sends an AppError with its own status, code and message', async () => {
    const res = await request(createFailingApp()).get('/forbidden');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: { code: 'FORBIDDEN', message: 'You cannot access this resource.' },
    });
  });

  it('includes extra details when an AppError carries them', async () => {
    const app = express();
    app.get('/invalid', () => {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid.', { bio: 'Too long.' });
    });
    app.use(errorHandler);

    const res = await request(app).get('/invalid');

    expect(res.body.error.details).toEqual({ bio: 'Too long.' });
  });

  it('hides the details of unexpected errors from the client', async () => {
    const logSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    const res = await request(createFailingApp()).get('/crash');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(res.body)).not.toContain('secret');
    expect(logSpy).toHaveBeenCalled();

    logSpy.mockRestore();
  });
});
