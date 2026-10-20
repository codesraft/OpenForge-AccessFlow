// This file configures the Next.js application. It sets up a rewrite rule that proxies requests from /api/* to the API_PROXY_TARGET if it is defined. This allows the client to make API requests to a different server while keeping the same origin, which can be useful for development or deployment scenarios.
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [{ source: '/api/:path*', destination: `${apiProxyTarget}/api/:path*` }];
  },
};

export default nextConfig;