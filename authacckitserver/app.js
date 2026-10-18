import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import { env } from './utils/env.js';
import healthRoutes from './routes/health.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';

// The app is built separately from starting the server, so tests can use it without a port.
export function createApp({ auth } = {}) {
  const app = express();

  // CORS is needed for the auth routes to work, since they are called from the client.
  app.use(cors({ origin: env.clientUrl, credentials: true }));

  // The auth routes are only added if the auth object is passed in. This is so that tests can run without needing to set up auth.
  if (auth) {
    app.all('/api/auth/{*splat}', toNodeHandler(auth));
  }

  app.use(express.json());

  app.use('/api', healthRoutes);

  // These must stay last: they only handle what the routes above did not.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}