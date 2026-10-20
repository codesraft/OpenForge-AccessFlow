# AuthAccKit Client

Next.js (App Router) frontend for AuthAccKit, a reusable authentication and account-lifecycle
kit. It talks to the `authacckitserver` API with the session cookie. The client never handles
passwords or tokens itself.

## Features

- Register, log in, log out, "Continue with Google"
- Email verification result page and a resend button
- Forgot password and reset password
- Protected routes that wait for the session check before redirecting
- Profile page with avatar upload (resized in the browser first)
- Security page: change password, view and revoke devices, delete account

## Quick start

```bash
git clone <this-repository-url>
cd authappkitclient
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The server from `authacckitserver` must be running too.

## Environment variables

| Variable              | Description                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Public URL of the server. Default `http://localhost:5000`.                                |
| `API_PROXY_TARGET`    | Optional. Server URL that `/api/*` is forwarded to (same-origin mode, see DEPLOYMENT.md). |

Nothing secret belongs in this file: `NEXT_PUBLIC_` values are visible in the browser.

## Scripts

| Command            | What it does                |
| ------------------ | --------------------------- |
| `npm run dev`      | Development server          |
| `npm run build`    | Production build            |
| `npm start`        | Serve the production build  |
| `npm test`         | Unit and component tests    |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run lint`     | ESLint                      |
| `npm run format`   | Prettier                    |

## Project structure

```
src/app/(auth)/        Login, register, forgot/reset password, verify email
src/app/(protected)/   Dashboard, profile, security (wrapped in ProtectedRoute)
src/components/auth/   Reusable forms, ProtectedRoute, Google button
src/components/ui/     Small shared pieces (fields, buttons, messages)
src/hooks/             TanStack Query hooks for session, profile, devices
src/lib/               API client, error messages, config, Zod schemas
```

## Reusing it in another project

- `ProtectedRoute` plus `useSession` show a skeleton while the session loads and redirect to
  `/login` only once the server has answered "no session".
- Forms in `components/auth` only depend on `lib/` and `components/ui`. Copy those folders and set
  `NEXT_PUBLIC_API_URL`.
- Paths such as `/login` and `/dashboard` live in `src/lib/config.js`.

## Deploying

1. Deploy the server first and note its URL.
2. Create a Vercel project from this repository and set `NEXT_PUBLIC_API_URL` to the server URL.
3. On the server, set `CLIENT_URL` to this deployment's URL, and add the Google redirect URI
   described in the server README.

Cookies between two separate deployments need HTTPS, `SameSite=None` and an exact `CLIENT_URL`.
If a browser still drops the cookie (Safari does for two `*.vercel.app` projects), switch to the
same-origin proxy mode described in [DEPLOYMENT.md](../DEPLOYMENT.md). See the server's
`docs/architecture.md` for details and common problems.