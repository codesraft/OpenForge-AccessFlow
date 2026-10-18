import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import { env } from './utils/env.js';
import healthRoutes from './routes/health.routes.js';
import { createProfileRoutes } from './routes/profile.routes.js';
import { createAccountRoutes } from './routes/account.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';

// The app is built separately from starting the server, so tests can use it without a port.
export function createApp({ auth } = {}) {
  const app = express();

  // CORS is needed because the client and server are on different ports in development. The client sends credentials (cookies) to the server, so the server must allow that.
  app.use(cors({ origin: env.clientUrl, credentials: true }));

  // The auth middleware is optional, so the server can run without it for testing or development. If auth is provided, it handles all /api/auth/* routes and provides req.user to the profile and account routes.
  if (auth) {
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