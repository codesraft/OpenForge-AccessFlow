import { z } from 'zod';

const MAX_NAME_LENGTH = 60;
const MAX_BIO_LENGTH = 300;

// Every field is optional so a client can send only what changed. Unknown fields are rejected.
export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name cannot be empty.')
      .max(MAX_NAME_LENGTH, `Name must be ${MAX_NAME_LENGTH} characters or fewer.`)
      .optional(),
    bio: z
      .string()
      .trim()
      .max(MAX_BIO_LENGTH, `Bio must be ${MAX_BIO_LENGTH} characters or fewer.`)
      .optional(),
    // https only: other schemes (javascript:, data:, http:) have no place in an image link.
    avatarUrl: z
      .url({ protocol: /^https$/, error: 'Avatar must be a secure (https) link.' })
      .nullable()
      .optional(),
  })
  .strict();