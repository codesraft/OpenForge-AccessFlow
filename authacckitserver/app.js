import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import { env } from './utils/env.js';
import healthRoutes from './routes/health.routes.js';
import { createProfileRoutes } from './routes/profile.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';

// The app is built separately from starting the server, so tests can use it without a port.
export function createApp({ auth } = {}) {
  const app = express();

  // CORS is needed for the client to call the API, and credentials are needed for the session cookie.
  app.use(cors({ origin: env.clientUrl, credentials: true }));

  // The auth middleware is optional, so the server can run without it for testing or development.
  if (auth) {
    app.all('/api/auth/{*splat}', toNodeHandler(auth));
  }

  app.use(express.json());

  app.use('/api', healthRoutes);

  // These routes need to know who is logged in, so they only exist when auth is available.
  if (auth) {
    app.use('/api/profile', createProfileRoutes(auth));
  }

  // These must stay last: they only handle what the routes above did not.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}