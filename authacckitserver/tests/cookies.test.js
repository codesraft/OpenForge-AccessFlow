import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCookieSettings } from '../auth/cookie-settings.js';
import { createAuthTestApp, signUpAndLogIn } from './helpers/auth-flow.js';
import { env } from '../utils/env.js';

vi.mock('../utils/env.js', () => import('./helpers/test-env.js'));
vi.mock('../services/email.service.js', () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

describe('getCookieSettings', () => {
  it('uses SameSite=None and Secure in production', () => {
    expect(getCookieSettings({ isProduction: true, cookieSameSite: 'none' })).toEqual({
      useSecureCookies: true,
      defaultCookieAttributes: { httpOnly: true, secure: true, sameSite: 'none' },
    });
  });

  it('works over plain HTTP in development', () => {
    expect(getCookieSettings({ isProduction: false, cookieSameSite: 'lax' })).toEqual({
      useSecureCookies: false,
      defaultCookieAttributes: { httpOnly: true, secure: false, sameSite: 'lax' },
    });
  });

  it('refuses SameSite=None without HTTPS, because browsers would drop the cookie', () => {
    expect(() => getCookieSettings({ isProduction: false, cookieSameSite: 'none' })).toThrow(
      /needs HTTPS/,
    );
  });
});

describe('the session cookie Better Auth sends', () => {
  const original = { ...env };

  beforeEach(() => vi.clearAllMocks());
  afterEach(() => Object.assign(env, original));

  async function loginCookieHeader() {
    const app = createAuthTestApp();
    const cookies = await signUpAndLogIn(app, 'sam@example.com');
    return cookies.find((cookie) => cookie.includes('session_token')).toLowerCase();
  }

  it('is HttpOnly, Secure and SameSite=None in production', async () => {
    Object.assign(env, { isProduction: true, cookieSameSite: 'none' });

    const cookie = await loginCookieHeader();

    expect(cookie).toContain('httponly');
    expect(cookie).toContain('secure');
    expect(cookie).toContain('samesite=none');
  });

  it('is HttpOnly and SameSite=Lax, without Secure, in development', async () => {
    const cookie = await loginCookieHeader();

    expect(cookie).toContain('httponly');
    expect(cookie).toContain('samesite=lax');
    expect(cookie).not.toContain('secure');
  });
});