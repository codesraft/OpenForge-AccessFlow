import { getProfilesCollection } from '../db/collections.js';

// Only these fields may be changed by the user; everything else on the document is server-owned.
const EDITABLE_FIELDS = ['avatarUrl', 'bio'];

function pickEditableFields(changes) {
  return Object.fromEntries(
    EDITABLE_FIELDS.filter((field) => field in changes).map((field) => [field, changes[field]]),
  );
}

// Profiles are created lazily, so users who registered before this feature existed still get one.
export function getOrCreateProfile(userId) {
  return getProfilesCollection().findOneAndUpdate(
    { userId },
    { $setOnInsert: { avatarUrl: null, bio: '', updatedAt: new Date() } },
    { upsert: true, returnDocument: 'after' },
  );
}

export async function updateProfile(userId, changes) {
  // Make sure the profile exists before changing it.
  await getOrCreateProfile(userId);

  return getProfilesCollection().findOneAndUpdate(
    { userId },
    { $set: { ...pickEditableFields(changes), updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
}

export function deleteProfile(userId) {
  return getProfilesCollection().deleteOne({ userId });
}

// Builds the public shape of a profile, so internal fields such as userId never reach the client.
export function toProfileResponse(user, profile) {
  return {
    name: user.name,
    email: user.email,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    updatedAt: profile.updatedAt,
  };
}