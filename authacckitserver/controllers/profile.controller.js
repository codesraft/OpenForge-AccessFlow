import { fromNodeHeaders } from 'better-auth/node';
import {
  getOrCreateProfile,
  updateProfile,
  toProfileResponse,
} from '../services/profile.service.js';
import { uploadAvatarImage } from '../services/avatar.service.js';
import { detectImageType } from '../utils/image-type.js';
import { AppError } from '../utils/app-error.js';

// Every handler works on req.user, which requireAuth took from the session. There is no
// user id in the URL or body, so a user cannot ask for anyone else's profile.
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

  async function uploadOwnAvatar(req, res) {
    if (!req.file) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Choose an image to upload.', {
        avatar: 'An image is required.',
      });
    }

    // The type is checked from the file's own bytes, not from the name or type the client claims.
    if (!detectImageType(req.file.buffer)) {
      throw new AppError(400, 'INVALID_FILE_TYPE', 'Only JPEG, PNG or WebP images are allowed.');
    }

    const avatarUrl = await uploadAvatarImage(req.file.buffer);
    const profile = await updateProfile(req.user.id, { avatarUrl });

    res.json(toProfileResponse(req.user, profile));
  }

  return { getProfile, updateProfile: updateOwnProfile, uploadAvatar: uploadOwnAvatar };
}
