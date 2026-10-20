import { z } from 'zod';

// Same limits as the server, which checks them again.
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

// One definition for every form that sets a new password, so the rules cannot drift apart.
export const newPasswordRule = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  .max(MAX_PASSWORD_LENGTH, `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`);

// Returns the arguments for zod's .refine(), checking that a confirmation field matches.
export function passwordsMatch(passwordField) {
  return [
    (data) => data[passwordField] === data.confirmPassword,
    { message: 'Passwords do not match.', path: ['confirmPassword'] },
  ];
}
