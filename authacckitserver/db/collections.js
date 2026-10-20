import { getDb } from './client.js';

// Names live in one place so indexes and queries cannot drift apart. "session" and "account" are Better Auth's own names.
export const COLLECTION_NAMES = {
  profiles: 'profiles',
  sessions: 'session',
  accounts: 'account',
};

export function getProfilesCollection() {
  return getDb().collection(COLLECTION_NAMES.profiles);
}