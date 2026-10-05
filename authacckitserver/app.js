import express from 'express';
import cors from 'cors';
import { env } from './utils/env.js';
import healthRoutes from './routes/health.routes.js';

// Builds the Express app without starting it, so tests can use it directly.
export function createApp() {
  const app = express();

  // Only our own frontend may call this API from a browser.
  // `credentials: true` lets the browser send the session cookie along.
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json());

  app.use('/api', healthRoutes);

  return app;
}