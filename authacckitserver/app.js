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

  // The server is behind a proxy in production, so it must trust the proxy to get the correct client IP address for rate limiting. The "trust proxy" setting tells Express to use the X-Forwarded-For header to determine the client's IP address, which is necessary for accurate rate limiting and logging. In development, this setting is not needed because the server is accessed directly without a proxy.
  if (env.isProduction) {
    app.set('trust proxy', 1);
  }

  // CORS is enabled for the client URL, allowing the client application to make requests to the server from a different origin. The credentials option is set to true, allowing cookies to be sent with requests, which is necessary for session management and authentication. This configuration ensures that the client can interact with the server securely while adhering to cross-origin resource sharing policies.
  app.use(cors({ origin: env.clientUrl, credentials: true }));

  // The auth object is only available in production and when the database is configured. If auth is not available, the authentication routes are not mounted, and the server will not handle authentication requests. This allows the server to run without authentication in development or testing environments where a database may not be set up.
  if (auth) {
    app.use(createAuthRateLimiter());
    app.all('/api/auth/{*splat}', toNodeHandler(auth));
  }

  app.use(express.json());

  app.use('/api', healthRoutes);

  // These routes need to know who is logged in, so they only exist when auth is available.
  if (auth) {
    app.use('/api/profile', createProfileRoutes(auth));
    app.use('/api/account', createAccountRoutes(auth));
  }

  // These must stay last: they only handle what the routes above did not.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}