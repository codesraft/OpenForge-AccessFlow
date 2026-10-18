// This file contains the environment configuration for the test environment of the Better Auth server. It defines the port on which the server will run, the client URL, trusted origins, authentication URL, authentication secret, production status, and cookie settings. The configuration is exported as an object named `env`, which can be imported and used in other parts of the application to access these settings during testing.
const clientUrl = 'http://localhost:3000';

export const env = {
  port: 5000,
  clientUrl,
  trustedOrigins: [clientUrl],
  authUrl: 'http://localhost:5000',
  authSecret: 'a-test-secret-that-is-long-enough-for-better-auth',
  isProduction: false,
  cookieSameSite: 'lax',
};