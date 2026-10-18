import { betterAuth } from 'better-auth';
import { env } from '../utils/env.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service.js';
import { sessionOwnershipGuard } from './session-ownership.js';

// Where the browser lands after clicking the link in an email.
const EMAIL_VERIFIED_REDIRECT = '/login';
const PASSWORD_RESET_REDIRECT = '/reset-password';

// Both links are valid for one hour, and Better Auth only accepts each of them once.
const EMAIL_LINK_LIFETIME_SECONDS = 60 * 60;

// Creates a URL that redirects the user to the client, which then redirects back to the server to complete the email verification or password reset. The client URL is used as the base, and the callbackURL query parameter is set to the target path. If the callbackURL is missing or set to "/", it is replaced with the default path for that type of link.
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

// Creates the auth object that is used by the server. It uses the environment variables to configure the auth middleware, and sets up the email and password authentication and email verification. The auth object is created with a database adapter, which can be an in-memory adapter for testing or a real database adapter for production. The auth object is used by the controllers to handle authentication-related requests.
export function createAuth(database) {
  if (!env.authSecret) {
    throw new Error('BETTER_AUTH_SECRET is not set');
  }

  return betterAuth({
    database,
    secret: env.authSecret,
    baseURL: env.authUrl,
    // Better Auth rejects requests from any other origin, including sign-in redirects.
    trustedOrigins: [env.clientUrl],
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
      // The user is not logged in yet, so the link must take them to the client, which will then redirect to the server to complete the verification.
      sendVerificationEmail: ({ user, url }) =>
        sendVerificationEmail({
          to: user.email,
          name: user.name,
          url: withClientRedirect(url, EMAIL_VERIFIED_REDIRECT),
        }),
    },
  });
}