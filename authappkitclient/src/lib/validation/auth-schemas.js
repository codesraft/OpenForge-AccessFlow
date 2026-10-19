import { z } from 'zod';

// Validation schemas for the auth forms. These are used both on the client and server, so that we can validate input in both places without duplicating code.
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 60;

const email = z.string().trim().pipe(z.email('Enter a valid email address.'));

const newPassword = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  .max(MAX_PASSWORD_LENGTH, `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`);

function passwordsMatch(passwordField) {
  return [
    (data) => data[passwordField] === data.confirmPassword,
    { message: 'Passwords do not match.', path: ['confirmPassword'] },
  ];
}

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Enter your name.')
      .max(MAX_NAME_LENGTH, `Name must be ${MAX_NAME_LENGTH} characters or fewer.`),
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine(...passwordsMatch('password'));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.'),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ newPassword, confirmPassword: z.string() })
  .refine(...passwordsMatch('newPassword'));