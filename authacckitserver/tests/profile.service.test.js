import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrCreateProfile, updateProfile } from '../services/profile.service.js';
import { getProfilesCollection } from '../db/collections.js';
import { createFakeProfilesCollection } from './helpers/fake-profiles-collection.js';

vi.mock('../db/collections.js', () => ({
  COLLECTION_NAMES: { profiles: 'profiles', sessions: 'session', accounts: 'account' },
  getProfilesCollection: vi.fn(),
}));

let collection;

beforeEach(() => {
  collection = createFakeProfilesCollection();
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
