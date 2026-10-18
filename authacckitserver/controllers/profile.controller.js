import { fromNodeHeaders } from 'better-auth/node';
import {
  getOrCreateProfile,
  updateProfile,
  toProfileResponse,
} from '../services/profile.service.js';

// This controller handles requests to get and update the user's profile. It uses the auth object to update the user's name in Better Auth, and the profile service to get and update the profile in the database. The profile is created on demand when the user first logs in, so it is guaranteed to exist after this function resolves. The profile is not created until the user logs in, so it is not possible to create a profile for a user that has never logged in.
export function createProfileController(auth) {
  async function getProfile(req, res) {
    const profile = await getOrCreateProfile(req.user.id);

    res.json(toProfileResponse(req.user, profile));
  }

  async function updateOwnProfile(req, res) {
    const { name, ...profileChanges } = req.body;
    let user = req.user;

    // The name belongs to the Better Auth user record, so Better Auth is the one to change it.
    if (name !== undefined) {
      await auth.api.updateUser({ body: { name }, headers: fromNodeHeaders(req.headers) });
      user = { ...user, name };
    }

    const profile = await updateProfile(user.id, profileChanges);

    res.json(toProfileResponse(user, profile));
  }

  return { getProfile, updateProfile: updateOwnProfile };
}