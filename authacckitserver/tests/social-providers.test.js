import { describe, it, expect } from 'vitest';
import { getSocialProviders, ACCOUNT_LINKING } from '../auth/social-providers.js';

describe('getSocialProviders', () => {
  it('enables Google when both credentials are set', () => {
    expect(getSocialProviders({ googleClientId: 'id', googleClientSecret: 'secret' })).toEqual({
      google: { clientId: 'id', clientSecret: 'secret' },
    });
  });

  it.each([
    ['both credentials are missing', {}],
    ['the secret is missing', { googleClientId: 'id' }],
    ['the client id is missing', { googleClientSecret: 'secret' }],
  ])('leaves Google off when %s', (_label, credentials) => {
    expect(getSocialProviders(credentials)).toEqual({});
  });
});

describe('ACCOUNT_LINKING', () => {
  it('never links a Google account to an existing account without the owner being logged in', () => {
    expect(ACCOUNT_LINKING.disableImplicitLinking).toBe(true);
  });
});