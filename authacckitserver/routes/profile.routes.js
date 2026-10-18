import { Router } from 'express';
import { createRequireAuth } from '../middleware/require-auth.js';
import { validateBody } from '../middleware/validate.js';
import { receiveAvatar } from '../middleware/upload.js';
import { createProfileController } from '../controllers/profile.controller.js';
import { updateProfileSchema } from '../validators/profile.validator.js';

export function createProfileRoutes(auth) {
  const router = Router();
  const controller = createProfileController(auth);

  // Everything below this line needs a logged-in, verified user.
  router.use(createRequireAuth(auth));

  router.get('/', controller.getProfile);
  router.patch('/', validateBody(updateProfileSchema), controller.updateProfile);
  router.post('/avatar', receiveAvatar, controller.uploadAvatar);

  return router;
}