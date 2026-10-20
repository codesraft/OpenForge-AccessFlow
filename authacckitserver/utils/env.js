import 'dotenv/config';

// Fallbacks match the local development setup, so the server starts without extra config.
const DEFAULT_PORT = 5000;
const DEFAULT_CLIENT_URL = 'http://localhost:3000';

const SAME_SITE_VALUES = ['lax', 'strict', 'none'];

// Required environment variables in production. If any are missing, the server will not start.
const REQUIRED_IN_PRODUCTION = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'CLIENT_URL',
  'SMTP_URL',
  'EMAIL_FROM',
];

const isProduction = process.env.NODE_ENV === 'production';

export function findMissingVars(names, source = process.env) {
  return names.filter((name) => !source[name]);
}

// Extra origins that may call the API (for example a preview deployment), comma separated.
const extraTrustedOrigins = (process.env.TRUSTED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const clientUrl = process.env.CLIENT_URL || DEFAULT_CLIENT_URL;

// Production defaults to "none" because the client and server live on different sites.
function readSameSite() {
  const value = (process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax')).toLowerCase();

  if (!SAME_SITE_VALUES.includes(value)) {
    throw new Error(`COOKIE_SAME_SITE must be one of: ${SAME_SITE_VALUES.join(', ')}.`);
  }
  return value;
}

// Every setting is read here once, so the rest of the code never touches process.env.
export const env = {
  port: Number(process.env.PORT) || DEFAULT_PORT,
  clientUrl,
  trustedOrigins: [clientUrl, ...extraTrustedOrigins],
  databaseUrl: process.env.DATABASE_URL,
  authSecret: process.env.BETTER_AUTH_SECRET,
  smtpUrl: process.env.SMTP_URL,
  emailFrom: process.env.EMAIL_FROM,
  authUrl: process.env.BETTER_AUTH_URL || `http://localhost:${DEFAULT_PORT}`,
  isProduction,
  imgbbApiKey: process.env.IMGBB_API_KEY,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  cookieSameSite: readSameSite(),
  missingProductionVars: isProduction ? findMissingVars(REQUIRED_IN_PRODUCTION) : [],
};
