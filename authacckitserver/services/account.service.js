import { deleteProfile } from './profile.service.js';

// The profile goes first: if removing the user then fails, the retry still finds a user to delete,
// whereas the reverse order could leave a profile that nobody can reach.
export async function deleteAccount(auth, userId) {
  await deleteProfile(userId);

  // The public deleteUser API needs a password or an email token, which OAuth-only users do not have.
  // The internal adapter also removes the user's sessions and linked accounts.
  const context = await auth.$context;
  await context.internalAdapter.deleteUser(userId);
}
