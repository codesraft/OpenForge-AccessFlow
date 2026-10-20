import { COLLECTION_NAMES } from './collections.js';

const INDEXES = [
  { collection: COLLECTION_NAMES.sessions, keys: { userId: 1 } },
  { collection: COLLECTION_NAMES.sessions, keys: { token: 1 }, options: { unique: true } },
  { collection: COLLECTION_NAMES.accounts, keys: { userId: 1 } },
  // Unique, so the database itself guarantees one profile per user.
  { collection: COLLECTION_NAMES.profiles, keys: { userId: 1 }, options: { unique: true } },
];

// Safe to run on every startup: MongoDB skips indexes that already exist.
export async function ensureIndexes(db) {
  await Promise.all(
    INDEXES.map(({ collection, keys, options }) =>
      db.collection(collection).createIndex(keys, options),
    ),
  );
}