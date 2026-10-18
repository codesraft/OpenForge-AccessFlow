import { betterAuth } from 'better-auth';
import { env } from '../utils/env.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service.js';
import { sessionOwnershipGuard } from './session-ownership.js';
import { getCookieSettings } from './cookie-settings.js';

// Where the browser lands after clicking the link in an email.
const EMAIL_VERIFIED_REDIRECT = '/login';
const PASSWORD_RESET_REDIRECT = '/reset-password';

// Both links are valid for one hour, and Better Auth only accepts each of them once.
const EMAIL_LINK_LIFETIME_SECONDS = 60 * 60;

// This function ensures that the callback URL in the email verification and password reset links points to the client application. If the callback URL is missing or set to "/", it defaults to a specified path. The function modifies the callback URL in the link to be an absolute URL pointing to the client application, ensuring that users are redirected correctly after verifying their email or resetting their password.
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

// Creates a Better Auth instance with the given database adapter and the server's configuration. The auth object is used to handle authentication and authorization for the application, including email verification, password reset, and session management. The auth object is configured with the server's secret, base URL, trusted origins, cookie settings, and hooks for session ownership checks.
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
      // The email verification link is only used to confirm the email address, so it does not log the user in. The user has to log in after verifying their email.
      sendVerificationEmail: ({ user, url }) =>
        sendVerificationEmail({
          to: user.email,
          name: user.name,
          url: withClientRedirect(url, EMAIL_VERIFIED_REDIRECT),
        }),
    },
  });
}