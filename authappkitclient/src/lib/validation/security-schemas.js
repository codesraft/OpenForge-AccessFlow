import { z } from 'zod';

// Same limits as the server, which checks them again.
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      .max(MAX_PASSWORD_LENGTH, `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`),
    confirmPassword: z.string(),
    revokeOtherSessions: z.boolean(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });