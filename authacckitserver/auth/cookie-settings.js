
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