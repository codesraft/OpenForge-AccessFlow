import { deleteAccount } from '../services/account.service.js';

// Deletion is confirmed by the validator before this runs, and only ever targets the logged-in user.
export function createAccountController(auth) {
  async function deleteOwnAccount(req, res) {
    await deleteAccount(auth, req.user.id);

    res.status(204).end();
  }

  return { deleteAccount: deleteOwnAccount };
}