// This file contains the configuration for social authentication providers, specifically Google in this case. The `getSocialProviders` function takes an object with Google client ID and secret, and returns a configuration object for the Google provider if both values are provided. If either value is missing, it returns an empty object, indicating that social authentication is not configured.
export function getSocialProviders({ googleClientId, googleClientSecret }) {
  if (!googleClientId || !googleClientSecret) return {};

  return {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  };
}

// The account linking feature allows users to link multiple authentication methods (e.g., email/password and social providers) to a single account. The configuration object specifies whether account linking is enabled and whether implicit linking (automatic linking of accounts with the same email) is disabled.
export const ACCOUNT_LINKING = {
  enabled: true,
  disableImplicitLinking: true,
};