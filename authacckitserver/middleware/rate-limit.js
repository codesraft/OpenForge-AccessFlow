import express, { Router } from 'express';
import { rateLimit, ipKeyGenerator, MINUTE, HOUR } from 'express-rate-limit';
import { AppError } from '../utils/app-error.js';

// The default rate limits for various authentication-related actions, such as signing in, signing up, requesting password resets, and sending verification emails. Each action has a specified time window and limits for requests per IP address and per email address. These limits help prevent abuse and ensure fair usage of the authentication system.
const DEFAULT_LIMITS = {
  signIn: { windowMs: 15 * MINUTE, perIp: 20, perEmail: 5 },
  signUp: { windowMs: HOUR, perIp: 10, perEmail: 3 },
  passwordReset: { windowMs: HOUR, perIp: 10, perEmail: 3 },
  // Each call sends an email, so without a limit it could be used to flood someone's inbox.
  verificationEmail: { windowMs: HOUR, perIp: 10, perEmail: 3 },
};

function createLimiter({ windowMs, limit, keyGenerator, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit,
    keyGenerator,
    skipSuccessfulRequests,
    // Goes through the shared error handler so a blocked request looks like every other error.
    handler: (req, res, next) =>
      next(new AppError(429, 'RATE_LIMITED', 'Too many attempts. Please try again later.')),
  });
}

const ipKey = (req) => ipKeyGenerator(req.ip);

// Lower-casing and trimming stops "Sam@x.com" and "sam@x.com " from counting as two accounts.
function emailKey(req) {
  const email = req.body?.email;
  return typeof email === 'string' ? `email:${email.trim().toLowerCase()}` : ipKey(req);
}

// Successful requests can be left uncounted, so a real user logging in is never locked out.
function limitersFor({ windowMs, perIp, perEmail }, { skipSuccessfulRequests = false } = {}) {
  return [
    createLimiter({ windowMs, limit: perIp, keyGenerator: ipKey, skipSuccessfulRequests }),
    createLimiter({ windowMs, limit: perEmail, keyGenerator: emailKey, skipSuccessfulRequests }),
  ];
}

// Limits can be overridden per route (the tests do this); anything left out keeps its default.
export function createAuthRateLimiter(overrides = {}) {
  const limits = { ...DEFAULT_LIMITS, ...overrides };
  const router = Router();
  const parseJson = express.json();

  router.post('/api/auth/sign-up/email', parseJson, ...limitersFor(limits.signUp));
  router.post(
    '/api/auth/sign-in/email',
    parseJson,
    ...limitersFor(limits.signIn, { skipSuccessfulRequests: true }),
  );
  router.post('/api/auth/request-password-reset', parseJson, ...limitersFor(limits.passwordReset));
  router.post(
    '/api/auth/send-verification-email',
    parseJson,
    ...limitersFor(limits.verificationEmail),
  );

  return router;
}