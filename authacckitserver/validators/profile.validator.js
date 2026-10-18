import { z } from 'zod';

const MAX_NAME_LENGTH = 60;
const MAX_BIO_LENGTH = 300;

// This schema validates the request body for updating a user's profile. It allows optional fields for name, bio, and avatarUrl, with specific constraints on each. Any extra fields in the request body will cause validation to fail.
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
    avatarUrl: z.url('Avatar must be a valid link.').nullable().optional(),
  })
  .strict();