import { Router } from 'express';
import { createRequireAuth } from '../middleware/require-auth.js';
import { validateBody } from '../middleware/validate.js';
import { createAccountController } from '../controllers/account.controller.js';
import { deleteAccountSchema } from '../validators/account.validator.js';

export function createAccountRoutes(auth) {
  const router = Router();
  const controller = createAccountController(auth);

  router.delete(
    '/',
    createRequireAuth(auth),
    validateBody(deleteAccountSchema),
    controller.deleteAccount,
  );

  return router;
}
