import 'dotenv/config';

// Fallbacks match the local development setup, so the server starts without extra config.
const DEFAULT_PORT = 5000;
const DEFAULT_CLIENT_URL = 'http://localhost:3000';

// Every setting is read here once, so the rest of the code never touches process.env.
export const env = {
  port: Number(process.env.PORT) || DEFAULT_PORT,
  clientUrl: process.env.CLIENT_URL || DEFAULT_CLIENT_URL,
  databaseUrl: process.env.DATABASE_URL,
};
