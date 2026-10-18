import { Router } from 'express';
import express from 'express';
import { rateLimit, ipKeyGenerator, MINUTE, HOUR } from 'express-rate-limit';
import { AppError } from '../utils/app-error.js';

// The default rate limits for the authentication routes. Each route has a time window (windowMs) and a maximum number of requests allowed per IP address (perIp) and per email address (perEmail). The limits are designed to prevent abuse while allowing legitimate users to access the service. The sign-in route has a lower limit for email addresses to prevent brute-force attacks, while the sign-up and password reset routes have higher limits to accommodate legitimate users.
const DEFAULT_LIMITS = {
  signIn: { windowMs: 15 * MINUTE, perIp: 20, perEmail: 5 },
  signUp: { windowMs: HOUR, perIp: 10, perEmail: 3 },
  passwordReset: { windowMs: HOUR, perIp: 10, perEmail: 3 },
};

function createLimiter({ windowMs, limit, keyGenerator, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit,
    keyGenerator,
    skipSuccessfulRequests,
    // When the limit is exceeded, the handler throws an AppError with a 429 status code and a standard error message. This ensures that the client receives a consistent error response format for rate limiting.
    handler: (req, res, next) =>
      next(new AppError(429, 'RATE_LIMITED', 'Too many attempts. Please try again later.')),
  });
}

const ipKey = (req) => ipKeyGenerator(req.ip);

// The email key is used to limit attempts per email address. It normalizes the email to lowercase and trims whitespace, so "
function emailKey(req) {
  const email = req.body?.email;
  return typeof email === 'string' ? `email:${email.trim().toLowerCase()}` : ipKey(req);
}

// Creates two limiters for a route: one that limits by IP address and one that limits by email address. The limits can be customized by passing an object with the desired windowMs, perIp, and perEmail values. The skipSuccessfulRequests option can be set to true to only count failed requests towards the limit, which is useful for sign-in routes where successful logins should not be penalized.
function limitersFor({ windowMs, perIp, perEmail }, { skipSuccessfulRequests = false } = {}) {
  return [
    createLimiter({ windowMs, limit: perIp, keyGenerator: ipKey, skipSuccessfulRequests }),
    createLimiter({ windowMs, limit: perEmail, keyGenerator: emailKey, skipSuccessfulRequests }),
  ];
}

// Creates a router that applies rate limiting to the authentication routes. The limits can be customized by passing an object with the desired limits for sign-up, sign-in, and password reset. Each route is limited twice: once per IP address and once per email address, to prevent abuse while allowing legitimate users to access the service. The router uses express-rate-limit to enforce the limits and returns a standard error response when the limit is exceeded.
export function createAuthRateLimiter(limits = DEFAULT_LIMITS) {
  const router = Router();
  const parseJson = express.json();

  router.post('/api/auth/sign-up/email', parseJson, ...limitersFor(limits.signUp));
  router.post(
    '/api/auth/sign-in/email',
    parseJson,
    ...limitersFor(limits.signIn, { skipSuccessfulRequests: true }),
  );
  router.post('/api/auth/request-password-reset', parseJson, ...limitersFor(limits.passwordReset));

  return router;
}