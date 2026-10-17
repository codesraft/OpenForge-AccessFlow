import { createApp } from './app.js';
import { env } from './utils/env.js';
import { connectToDatabase, closeDatabase } from './db/client.js';
import { logger } from './utils/logger.js';

async function start() {
  try {
    await connectToDatabase();
  } catch (error) {
    // Running without a database would fail on every request, so stop right away.
    logger.error('Could not connect to MongoDB:', error.message);
    process.exit(1);
  }

  const server = createApp().listen(env.port, () => {
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