// This file contains the configuration for cookie settings used in the authentication server. The `getCookieSettings` function takes an object with `isProduction` and `cookieSameSite` properties and returns an object with cookie settings. It ensures that if `cookieSameSite` is set to 'none', the cookies are only used in a secure context (HTTPS) by checking the `isProduction` flag. If the conditions are not met, it throws an error to prevent insecure cookie usage. The returned object includes whether to use secure cookies and the default attributes for cookies, including `httpOnly`, `secure`, and `sameSite`.
export function getCookieSettings({ isProduction, cookieSameSite }) {
  const secure = isProduction;

  if (cookieSameSite === 'none' && !secure) {
    throw new Error('COOKIE_SAME_SITE=none needs HTTPS: set NODE_ENV=production or use "lax".');
  }

  return {
    useSecureCookies: secure,
    defaultCookieAttributes: { httpOnly: true, secure, sameSite: cookieSameSite },
  };
}