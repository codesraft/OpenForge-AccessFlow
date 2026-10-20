import { z } from 'zod';

// Deleting an account cannot be undone, so the request must contain an explicit confirmation.
export const deleteAccountSchema = z
  .object({
    confirmation: z.literal('DELETE', 'Type DELETE to confirm.'),
  })
  .strict();