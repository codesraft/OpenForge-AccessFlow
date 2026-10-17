import { getDb } from './client.js';

// The collection names are centralized here so they can be changed in one place if needed, and so they can be used consistently across the server code.
export const COLLECTION_NAMES = {
  profiles: 'profiles',
  sessions: 'session',
  accounts: 'account',
};

export function getProfilesCollection() {
  return getDb().collection(COLLECTION_NAMES.profiles);
}