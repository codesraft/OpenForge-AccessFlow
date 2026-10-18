import { z } from 'zod';

// This schema validates the request body for deleting a user's account. It requires a confirmation field that must be the literal string "DELETE". Any extra fields in the request body will cause validation to fail.
export const deleteAccountSchema = z
  .object({
    confirmation: z.literal('DELETE', 'Type DELETE to confirm.'),
  })
  .strict();