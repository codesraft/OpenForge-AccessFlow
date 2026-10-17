import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrCreateProfile, updateProfile } from '../services/profile.service.js';
import { getProfilesCollection } from '../db/collections.js';

vi.mock('../db/collections.js', () => ({
  COLLECTION_NAMES: { profiles: 'profiles', sessions: 'session', accounts: 'account' },
  getProfilesCollection: vi.fn(),
}));

// A fake collection that simulates the behavior of a MongoDB collection for testing purposes. It stores documents in a Map and implements the findOneAndUpdate method to support upsert and field updates.
function createFakeCollection() {
  const documents = new Map();

  return {
    documents,
    findOneAndUpdate: async ({ userId }, update, { upsert = false } = {}) => {
      let document = documents.get(userId);

      if (!document && upsert) {
        document = { userId, ...update.$setOnInsert };
        documents.set(userId, document);
      }
      if (document && update.$set) {
        Object.assign(document, update.$set);
      }
      return document ?? null;
    },
  };
}

let collection;

beforeEach(() => {
  collection = createFakeCollection();
  getProfilesCollection.mockReturnValue(collection);
});

describe('getOrCreateProfile', () => {
  it('creates an empty profile the first time', async () => {
    const profile = await getOrCreateProfile('user-1');

    expect(profile).toMatchObject({ userId: 'user-1', avatarUrl: null, bio: '' });
  });

  it('returns the same profile on later calls instead of creating another', async () => {
    await getOrCreateProfile('user-1');
    await getOrCreateProfile('user-1');

    expect(collection.documents.size).toBe(1);
  });
});

describe('updateProfile', () => {
  it('updates the editable fields', async () => {
    const profile = await updateProfile('user-1', { bio: 'Full-stack developer' });

    expect(profile.bio).toBe('Full-stack developer');
  });

  it('ignores fields that are not editable', async () => {
    const profile = await updateProfile('user-1', { userId: 'someone-else', bio: 'Hello' });

    expect(profile.userId).toBe('user-1');
    expect(collection.documents.has('someone-else')).toBe(false);
  });
});