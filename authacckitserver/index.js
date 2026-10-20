import { createConfiguredApp } from './create-server-app.js';
import { env } from './utils/env.js';
import { closeDatabase } from './db/client.js';
import { logger } from './utils/logger.js';

async function start() {
  if (env.missingProductionVars.length > 0) {
    logger.error(`Missing environment variables: ${env.missingProductionVars.join(', ')}`);
    process.exit(1);
  }

  let app;
  try {
    app = await createConfiguredApp();
  } catch (error) {
    // Without the database or auth config every request would fail, so stop right away.
    logger.error('Could not start the server:', error.message);
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    logger.info(`AuthAccKit server running on port ${env.port}`);
  });

  // Finish in-flight requests and release the database connection before exiting.
  const shutdown = () => {
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();