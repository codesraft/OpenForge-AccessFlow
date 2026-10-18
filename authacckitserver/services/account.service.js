import { deleteProfile } from './profile.service.js';

// This function deletes a user's account and their associated profile. It first deletes the profile from the database, and then uses the internal adapter of the auth object to delete the user from Better Auth. The internal adapter is used because the public API requires a password or token, which may not be available on the server side. This function should only be called from server-side code, not from the client.
export async function deleteAccount(auth, userId) {
  await deleteProfile(userId);

  // The internal adapter is the only way to delete a user, because the public API requires a password or a token. The internal adapter is only available on the server side, so this function cannot be called from the client.
  const context = await auth.$context;
  await context.internalAdapter.deleteUser(userId);
}