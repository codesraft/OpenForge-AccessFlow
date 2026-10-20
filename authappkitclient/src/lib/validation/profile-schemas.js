import { z } from 'zod';

// Same limits as the server, which checks them again.
const MAX_NAME_LENGTH = 60;
const MAX_BIO_LENGTH = 300;

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter your name.')
    .max(MAX_NAME_LENGTH, `Name must be ${MAX_NAME_LENGTH} characters or fewer.`),
  bio: z.string().trim().max(MAX_BIO_LENGTH, `Bio must be ${MAX_BIO_LENGTH} characters or fewer.`),
});
