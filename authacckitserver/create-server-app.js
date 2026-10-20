import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { createApp } from './app.js';
import { createAuth } from './auth/auth.js';
import { connectToDatabase } from './db/client.js';
import { ensureIndexes } from './db/indexes.js';

// Shared by the long-running server (index.js) and the Vercel function (api/index.js),
// so both start up exactly the same way.
export async function createConfiguredApp() {
  const db = await connectToDatabase();
  await ensureIndexes(db);
  return createApp({ auth: createAuth(mongodbAdapter(db)) });
}