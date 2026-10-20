import { z } from 'zod';
import { newPasswordRule, passwordsMatch } from './password-rules';

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: newPasswordRule,
    confirmPassword: z.string(),
    revokeOtherSessions: z.boolean(),
  })
  .refine(...passwordsMatch('newPassword'));