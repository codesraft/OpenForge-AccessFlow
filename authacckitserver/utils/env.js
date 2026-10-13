import 'dotenv/config';

// Default values for environment variables if they are not set

const DEFAULT_PORT = 5000;
const DEFAULT_CLIENT_URL = 'http://localhost:3000';

export const env = {
  port: Number(process.env.PORT) || DEFAULT_PORT,
  clientUrl: process.env.CLIENT_URL || DEFAULT_CLIENT_URL,
  databaseUrl: process.env.DATABASE_URL,
};