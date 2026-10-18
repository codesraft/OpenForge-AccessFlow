import { getProfilesCollection } from '../db/collections.js';

// The fields that users are allowed to change in their profile. Any other fields in the profile are managed by the server and cannot be changed by the user.
const EDITABLE_FIELDS = ['avatarUrl', 'bio'];

function pickEditableFields(changes) {
  return Object.fromEntries(
    EDITABLE_FIELDS.filter((field) => field in changes).map((field) => [field, changes[field]]),
  );
}

// The profile is created on demand when the user first logs in, so it is guaranteed to exist after this function resolves. The profile is not created until the user logs in, so it is not possible to create a profile for a user that has never logged in.
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

// This function deletes the profile for a user. It is called when the user deletes their account, so it is not possible to delete a profile for a user that has never logged in.
export function toProfileResponse(user, profile) {
  return {
    name: user.name,
    email: user.email,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    updatedAt: profile.updatedAt,
  };
}