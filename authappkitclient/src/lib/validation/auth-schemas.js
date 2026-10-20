import { z } from 'zod';
import { newPasswordRule, passwordsMatch } from './password-rules';

const MAX_NAME_LENGTH = 60;

const email = z.string().trim().pipe(z.email('Enter a valid email address.'));

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Enter your name.')
      .max(MAX_NAME_LENGTH, `Name must be ${MAX_NAME_LENGTH} characters or fewer.`),
    email,
    password: newPasswordRule,
    confirmPassword: z.string(),
  })
  .refine(...passwordsMatch('password'));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.'),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ newPassword: newPasswordRule, confirmPassword: z.string() })
  .refine(...passwordsMatch('newPassword'));
