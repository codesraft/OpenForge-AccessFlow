import express from 'express';
import cors from 'cors';
import { env } from './utils/env.js';
import healthRoutes from './routes/health.routes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

// This module sets up the Express application, including middleware for CORS, JSON parsing, and routing. It also includes error handling middleware to catch and respond to errors in a consistent manner. The `createApp` function returns the configured Express app instance, which can be used to start the server or for testing purposes.
export function createApp() {
  const app = express();

  // CORS configuration to allow requests from the client URL and include credentials (cookies) in cross-origin requests.
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json());

  app.use('/api', healthRoutes);

  // Error handling middleware must be added after all other routes and middleware.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}