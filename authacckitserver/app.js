import express from 'express';
import cors from 'cors';
import { env } from './utils/env.js';
import healthRoutes from './routes/health.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';

// The app is built separately from starting the server, so tests can use it without a port.
export function createApp() {
  const app = express();

  // Only our own frontend may call the API from a browser, and `credentials`
  // lets the browser send the session cookie with those requests.
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json());

  app.use('/api', healthRoutes);

  // These must stay last: they only handle what the routes above did not.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}