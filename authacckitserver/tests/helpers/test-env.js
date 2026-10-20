// Fixed settings that replace utils/env.js in tests, so results never depend on a developer's .env.
const clientUrl = 'http://localhost:3000';

export const env = {
  port: 5000,
  clientUrl,
  trustedOrigins: [clientUrl],
  authUrl: 'http://localhost:5000',
  authSecret: 'a-test-secret-that-is-long-enough-for-better-auth',
  isProduction: false,
  cookieSameSite: 'lax',
  imgbbApiKey: 'test-imgbb-key',
  googleClientId: 'test-google-client-id',
  googleClientSecret: 'test-google-client-secret',
};