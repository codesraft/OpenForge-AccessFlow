import { MongoClient } from 'mongodb';
import { env } from '../utils/env.js';

// This module manages the MongoDB client connection. It ensures that only one connection is established and reused across the application. The `connectToDatabase` function connects to the database, `getDb` retrieves the database instance, and `closeDatabase` closes the connection when it's no longer needed.
let client = null;
let connecting = null;

export function connectToDatabase() {
  // Calling this twice (or at the same time) reuses the same connection.
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
      // If the connection fails, we reset the connecting variable so that future attempts can be made.
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