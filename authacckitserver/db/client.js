import { MongoClient } from 'mongodb';
import { env } from '../utils/env.js';

// One shared client for the whole process: MongoDB manages its own connection pool.
let client = null;

// Remembers an attempt in progress, so simultaneous callers do not open two connections.
let connecting = null;

export function connectToDatabase() {
  if (connecting) return connecting;

  if (!env.databaseUrl) {
    return Promise.reject(new Error('DATABASE_URL is not set'));
  }

  const newClient = new MongoClient(env.databaseUrl);

  connecting = newClient
    .connect()
    .then(() => {
      client = newClient;
      return client.db();
    })
    .catch((error) => {
      // Clear the failed attempt so a later call can try again.
      connecting = null;
      throw error;
    });

  return connecting;
}

export function getDb() {
  if (!client) {
    throw new Error('Database is not connected yet. Call connectToDatabase() first.');
  }
  return client.db();
}

export async function closeDatabase() {
  if (!client) return;
  await client.close();
  client = null;
  connecting = null;
}
