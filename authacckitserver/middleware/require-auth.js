import { fromNodeHeaders } from 'better-auth/node';
import { AppError } from '../utils/app-error.js';

// This middleware checks that the request has a valid session and that the user's email is verified. It adds the user and session to the request object for later handlers to use.
export function createRequireAuth(auth) {
  return async function requireAuth(req, res, next) {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

    if (!session) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Please log in to continue.');
    }

    // Sign-in already blocks unverified emails, but this keeps working if that setting changes.
    if (!session.user.emailVerified) {
      throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email to continue.');
    }

    // Later handlers use these to know who is asking, instead of trusting an id from the client.
    req.user = session.user;
    req.session = session.session;
    next();
  };
}