import { betterAuth } from 'better-auth';
import { env } from '../utils/env.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service.js';
import { sessionOwnershipGuard } from './session-ownership.js';
import { getCookieSettings } from './cookie-settings.js';
import { getSocialProviders, ACCOUNT_LINKING } from './social-providers.js';

// Where the browser lands after clicking the link in an email.
const EMAIL_VERIFIED_REDIRECT = '/verify-email';
const PASSWORD_RESET_REDIRECT = '/reset-password';

// Both links are valid for one hour, and Better Auth only accepts each of them once.
const EMAIL_LINK_LIFETIME_SECONDS = 60 * 60;

// Better Auth builds these links on the server, so without this the browser would end up on
// the API after clicking one. The callback is rewritten to an absolute client URL.
function withClientRedirect(url, defaultPath) {
  const link = new URL(url);
  const callback = link.searchParams.get('callbackURL');
  const target = !callback || callback === '/' ? defaultPath : callback;

  link.searchParams.set(
    'callbackURL',
    target.startsWith('/') ? `${env.clientUrl}${target}` : target,
  );
  return link.toString();
}

// The database adapter is passed in so tests can use an in-memory one.
export function createAuth(database) {
  if (!env.authSecret) {
    throw new Error('BETTER_AUTH_SECRET is not set');
  }

  return betterAuth({
    database,
    secret: env.authSecret,
    baseURL: env.authUrl,
    // Better Auth rejects requests from any other origin, including sign-in redirects.
    trustedOrigins: env.trustedOrigins,
    advanced: getCookieSettings(env),
    socialProviders: getSocialProviders(env),
    account: { accountLinking: ACCOUNT_LINKING },
    hooks: { before: sessionOwnershipGuard },
    emailAndPassword: {
      enabled: true,
      // Nobody can log in until they have confirmed their email address.
      requireEmailVerification: true,
      resetPasswordTokenExpiresIn: EMAIL_LINK_LIFETIME_SECONDS,
      // A reset usually means the password may have been exposed, so every device is logged out.
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: ({ user, url }) =>
        sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          url: withClientRedirect(url, PASSWORD_RESET_REDIRECT),
        }),
    },
    emailVerification: {
      sendOnSignUp: true,
      expiresIn: EMAIL_LINK_LIFETIME_SECONDS,
      // The link only confirms the address, so the user logs in themselves afterwards.
      sendVerificationEmail: ({ user, url }) =>
        sendVerificationEmail({
          to: user.email,
          name: user.name,
          url: withClientRedirect(url, EMAIL_VERIFIED_REDIRECT),
        }),
    },
  });
}