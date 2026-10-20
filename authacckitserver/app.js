import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import { env } from './utils/env.js';
import healthRoutes from './routes/health.routes.js';
import { createProfileRoutes } from './routes/profile.routes.js';
import { createAccountRoutes } from './routes/account.routes.js';
import { createAuthRateLimiter } from './middleware/rate-limit.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';

// The app is built separately from starting the server, so tests can use it without a port.
export function createApp({ auth } = {}) {
  const app = express();

  // In production the app is behind a proxy (like Nginx), so Express must trust it to get the real client IP address for rate limiting. In development there is no proxy, so this is not needed.
  if (env.isProduction) {
    app.set('trust proxy', 1);
  }

  // CORS is needed for the client to call the API, and credentials are needed for the session cookie.
  app.use(cors({ origin: env.trustedOrigins, credentials: true }));

  // Tests build the app without Better Auth (no database), so these routes are optional.
  if (auth) {
    app.use(createAuthRateLimiter());
    app.all('/api/auth/{*splat}', toNodeHandler(auth));
  }

  // Must come after the Better Auth handler, which reads the raw request body itself.
  app.use(express.json());

  app.use('/api', healthRoutes);

  if (auth) {
    app.use('/api/profile', createProfileRoutes(auth));
    app.use('/api/account', createAccountRoutes(auth));
  }

  // These must stay last: they only handle what the routes above did not.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
