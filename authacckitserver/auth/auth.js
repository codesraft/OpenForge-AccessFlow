import { betterAuth } from 'better-auth';
import { env } from '../utils/env.js';
import { sendVerificationEmail } from '../services/email.service.js';

// Where the browser lands after clicking the link in the verification email.
const EMAIL_VERIFIED_REDIRECT = '/login';

// The link is valid for one hour and Better Auth only accepts it once.
const VERIFICATION_LINK_LIFETIME_SECONDS = 60 * 60;

// The verification email is sent to the user with a callbackURL that points to the client. This function rewrites the callbackURL to point to the client instead of the server.
function withClientRedirect(url) {
  const link = new URL(url);
  const callback = link.searchParams.get('callbackURL');
  const target = !callback || callback === '/' ? EMAIL_VERIFIED_REDIRECT : callback;

  link.searchParams.set(
    'callbackURL',
    target.startsWith('/') ? `${env.clientUrl}${target}` : target,
  );
  return link.toString();
}

// The auth middleware is optional, so the server can run without it for testing or development.
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
    emailAndPassword: {
      enabled: true,
      // Nobody can log in until they have confirmed their email address.
      requireEmailVerification: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      expiresIn: VERIFICATION_LINK_LIFETIME_SECONDS,
      // The email verification link is sent to the user with a callbackURL that points to the client.
      sendVerificationEmail: ({ user, url }) =>
        sendVerificationEmail({ to: user.email, name: user.name, url: withClientRedirect(url) }),
    },
  });
}