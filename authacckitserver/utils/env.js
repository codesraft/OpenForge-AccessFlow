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
  // The cookie SameSite setting is "none" in production, which allows the browser to send the cookie across origins. In development, it is "lax", which allows the cookie to be sent on same-site requests and top-level navigation GET requests.
  cookieSameSite: (process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax')).toLowerCase(),
};