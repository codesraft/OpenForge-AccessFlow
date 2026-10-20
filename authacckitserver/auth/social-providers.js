// Google is only enabled when both credentials are set, so the kit runs without OAuth configured.
export function getSocialProviders({ googleClientId, googleClientSecret }) {
  if (!googleClientId || !googleClientSecret) return {};

  return {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  };
}

// Account linking is enabled by default, but can be disabled for testing or if the app does not want to support it. Implicit linking is disabled by default because it can be confusing for users, but can be enabled if the app wants to support it.
export const ACCOUNT_LINKING = {
  enabled: true,
  disableImplicitLinking: true,
};
