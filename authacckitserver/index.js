import { createApp } from './app.js';
import { env } from './utils/env.js';
import { connectToDatabase, closeDatabase } from './db/client.js';

async function start() {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Could not connect to MongoDB:', error.message);
    process.exit(1);
  }

  const server = createApp().listen(env.port, () => {
    console.log(`AuthAccKit server running on port ${env.port}`);
  });

  // Close the server and the database cleanly when the process is stopped.
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