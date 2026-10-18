import { deleteAccount } from '../services/account.service.js';

// This controller handles requests to delete the user's account. It uses the account service to delete the user's profile and Better Auth user record. The request must be authenticated, and the user must confirm the deletion by sending a request body with a confirmation field set to "DELETE". The controller responds with a 204 No Content status code on success.
export function createAccountController(auth) {
  async function deleteOwnAccount(req, res) {
    await deleteAccount(auth, req.user.id);

    res.status(204).end();
  }

  return { deleteAccount: deleteOwnAccount };
}