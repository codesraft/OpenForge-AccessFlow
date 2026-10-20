import 'dotenv/config';

// Fallbacks match the local development setup, so the server starts without extra config.
const DEFAULT_PORT = 5000;
const DEFAULT_CLIENT_URL = 'http://localhost:3000';

const isProduction = process.env.NODE_ENV === 'production';

// Extra origins that may call the API (for example a preview deployment), comma separated.
const extraTrustedOrigins = (process.env.TRUSTED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const clientUrl = process.env.CLIENT_URL || DEFAULT_CLIENT_URL;

const SAME_SITE_VALUES = ['lax', 'strict', 'none'];

// The `readSameSite` function reads the `COOKIE_SAME_SITE` environment variable and validates its value. It defaults to 'none' in production and 'lax' in development. The function ensures that the value is one of the accepted options ('lax', 'strict', or 'none') and throws an error if it is not. This helps enforce proper cookie handling based on the environment, ensuring that cookies are used securely when necessary.
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
  // Production defaults to "none" because the client and server live on different sites.
  cookieSameSite: readSameSite(),
};