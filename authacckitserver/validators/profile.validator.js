import { z } from 'zod';

const MAX_BIO_LENGTH = 300;

// This schema validates the request body for updating a user's profile. It checks that the bio is a string with a maximum length of 300 characters and that the avatarUrl is a valid URL or null. Both fields are optional, and any extra fields in the request body will cause validation to fail.
export const updateProfileSchema = z
  .object({
    bio: z
      .string()
      .trim()
      .max(MAX_BIO_LENGTH, `Bio must be ${MAX_BIO_LENGTH} characters or fewer.`)
      .optional(),
    avatarUrl: z.url('Avatar must be a valid link.').nullable().optional(),
  })
  .strict();