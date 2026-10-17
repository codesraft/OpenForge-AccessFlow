import { MongoClient } from 'mongodb';
import { env } from '../utils/env.js';

// The MongoClient instance is created once and reused for all database operations. This avoids the overhead of creating a new connection for each request, which can be expensive and lead to resource exhaustion.
let client = null;

// A promise that resolves when the connection is established, or rejects if it fails.
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
