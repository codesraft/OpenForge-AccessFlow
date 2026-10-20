import { createConfiguredApp } from './create-server-app.js';
import { env } from './utils/env.js';
import { closeDatabase } from './db/client.js';
import { logger } from './utils/logger.js';

let cachedApp = null;

async function getApp() {
  if (cachedApp) return cachedApp;

  if (env.missingProductionVars && env.missingProductionVars.length > 0) {
    logger.error(`Missing environment variables: ${env.missingProductionVars.join(', ')}`);
    throw new Error(`Missing environment variables: ${env.missingProductionVars.join(', ')}`);
  }

  try {
    cachedApp = await createConfiguredApp();
    return cachedApp;
  } catch (error) {
    logger.error('Could not start the server:', error.message);
    throw error;
  }
}

// Local development server startup
if (process.env.NODE_ENV !== 'production') {
  getApp().then(app => {
    const server = app.listen(env.port, () => {
      logger.info(`AuthAccKit server running on port ${env.port}`);
    });

    const shutdown = () => {
      server.close(async () => {
        await closeDatabase();
        process.exit(0);
      });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

// Serverless export for Vercel
export default async function handler(req, res) {
  const app = await getApp();
  return app(req, res);
}