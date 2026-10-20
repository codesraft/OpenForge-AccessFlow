import { createConfiguredApp } from '../create-server-app.js';
import { env } from '../utils/env.js';
import { logger } from '../utils/logger.js';

// Vercel keeps this module in memory between requests, so the app and its database connection
// are built once and reused. A failed start is forgotten so the next request can try again.
let appPromise = null;

function getApp() {
  if (!appPromise) {
    if (env.missingProductionVars.length > 0) {
      throw new Error(`Missing environment variables: ${env.missingProductionVars.join(', ')}`);
    }

    appPromise = createConfiguredApp().catch((error) => {
      appPromise = null;
      throw error;
    });
  }
  return appPromise;
}

// Vercel runs this as a serverless function instead of calling app.listen() like index.js does.
export default async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    // The real reason stays in the logs; the client only gets the standard generic error.
    logger.error('Could not start the server:', error.message);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
    });
  }
}