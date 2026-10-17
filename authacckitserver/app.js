import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import { env } from './utils/env.js';
import healthRoutes from './routes/health.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';

// The app is built separately from starting the server, so tests can use it without a port.
export function createApp({ auth } = {}) {
  const app = express();

  // Allow the client to make requests from a different origin, and send the session cookie.
  app.use(cors({ origin: env.clientUrl, credentials: true }));

  // The auth middleware is optional, so the server can run without it for testing or development.
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