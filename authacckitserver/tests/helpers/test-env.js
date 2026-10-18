// This file defines the environment variables used in the test environment for the AuthAccKit server. It includes settings such as the server port, client URL, trusted origins, authentication URL and secret, production flag, cookie same-site policy, and the imgBB API key for image uploads. These variables are exported as an object named `env` for use in tests and other parts of the application that require access to these configuration values.
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
};