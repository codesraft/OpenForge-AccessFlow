# AuthAccKit Server

Express API for AuthAccKit, a reusable authentication and account-lifecycle kit. It runs
[Better Auth](https://www.better-auth.com) (passwords, sessions, tokens, Google OAuth) on top of
MongoDB, and adds the profile, avatar and account-deletion endpoints.

The matching Next.js client lives in the `authappkitclient` repository.

## Features

- Email and password sign-up with required email verification
- Login, logout, forgot password, reset password, change password
- Google sign-in (optional, enabled when credentials are set)
- Session and device management (list, revoke one, log out other devices)
- Profile (name, bio, avatar uploaded to imgBB) and account deletion
- Rate limiting by IP and by email on sign-up, sign-in, password reset and verification emails
- One error format for every failure: `{ "error": { "code", "message" } }`

## Requirements

- Node.js 22 or newer
- A MongoDB database (MongoDB Atlas free tier works)
- An SMTP provider for emails (for example Resend). Optional in development.

## Quick start

```bash
git clone <this-repository-url>
cd authacckitserver
npm install
cp .env.example .env     # then fill in the values, see the table below
npm run dev
```

Check that it works: `GET http://localhost:5000/api/health` should answer `{ "status": "ok" }`.

In development, if `SMTP_URL` is empty, verification and reset emails are printed in the terminal
so you can copy the links without an email provider.

## Environment variables

| Variable               | Required in production | Description                                                                    |
| ---------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| `PORT`                 | No                     | Port to listen on. Default `5000`.                                             |
| `NODE_ENV`             | Yes                    | Set to `production` when deployed. Turns on Secure cookies.                    |
| `DATABASE_URL`         | Yes                    | MongoDB connection string, including the database name.                        |
| `BETTER_AUTH_SECRET`   | Yes                    | Long random string used to sign sessions. `openssl rand -base64 32`.           |
| `BETTER_AUTH_URL`      | Yes                    | Public URL of this server. Used to build email links and OAuth callbacks.      |
| `CLIENT_URL`           | Yes                    | Public URL of the client. The only origin allowed by CORS (plus below).        |
| `TRUSTED_ORIGINS`      | No                     | Extra allowed origins, comma separated (for example a preview URL).            |
| `SMTP_URL`             | Yes                    | `smtp://user:password@host:587` for your email provider.                       |
| `EMAIL_FROM`           | Yes                    | Sender address of the emails.                                                  |
| `GOOGLE_CLIENT_ID`     | No                     | Enables Google sign-in together with the secret.                               |
| `GOOGLE_CLIENT_SECRET` | No                     | See above.                                                                     |
| `IMGBB_API_KEY`        | No                     | Needed for avatar uploads.                                                     |
| `COOKIE_SAME_SITE`     | No                     | `lax`, `strict` or `none`. Default `lax` in development, `none` in production. |

In production the server refuses to start if a required variable is missing, and names it in
the log.

## Setting up Google sign-in

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an
   **OAuth client ID** of type _Web application_.
2. Add these **Authorized redirect URIs** (Google sends the user back to the server, not the client):
   - `http://localhost:5000/api/auth/callback/google`
   - `https://<your-server-domain>/api/auth/callback/google`
3. Copy the client ID and secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

After signing in, Better Auth sends the browser back to the client URL with the session cookie set.

If the Google email already belongs to a password account, the accounts are **not** merged
automatically. The user is asked to log in with their password first.

## Setting up email

Any SMTP provider works. With [Resend](https://resend.com), use
`SMTP_URL=smtps://resend:<api-key>@smtp.resend.com:465` and a sender address on a domain you have
verified. Email failures are logged on the server; the user only sees a generic message.

## Scripts

| Command          | What it does                  |
| ---------------- | ----------------------------- |
| `npm run dev`    | Start with automatic restart  |
| `npm start`      | Start for production          |
| `npm test`       | Run the tests                 |
| `npm run lint`   | Check the code with ESLint    |
| `npm run format` | Format the code with Prettier |

## API

Better Auth serves everything under `/api/auth/*`. This server adds:

| Method | Endpoint              | Purpose                                                  |
| ------ | --------------------- | -------------------------------------------------------- |
| GET    | `/api/health`         | Health check                                             |
| GET    | `/api/profile`        | Get the logged-in user's profile                         |
| PATCH  | `/api/profile`        | Update name, bio or avatar link                          |
| POST   | `/api/profile/avatar` | Upload an avatar (multipart `avatar`)                    |
| DELETE | `/api/account`        | Delete the account (body `{ "confirmation": "DELETE" }`) |

The full API, the authentication flow and troubleshooting are in
[docs/architecture.md](docs/architecture.md).

## Deploying

1. Create a MongoDB Atlas cluster and allow your host's IP addresses in **Network Access**.
2. Deploy this repository (Vercel, Render or similar) with `NODE_ENV=production` and every
   variable from the table above. On Vercel nothing else is needed: `vercel.json` and
   `api/index.js` run the Express app as a serverless function. On Render or a VPS, run
   `npm start`.
3. Set `BETTER_AUTH_URL` to the deployed server URL and `CLIENT_URL` to the deployed client URL.
4. Add the production redirect URI to your Google OAuth client.
5. Deploy the client with `NEXT_PUBLIC_API_URL` pointing at this server.
6. Check the full flow once on the production URLs: sign up, verify, log in, Google, reset
   password, refresh the page.

Step-by-step instructions with exact values for both deployments are in
[DEPLOYMENT.md](../DEPLOYMENT.md).

> **Rate limiting note:** the limiter keeps its counters in memory. That is fine for a single
> server, but counters are not shared between several instances or serverless invocations. Use a
> shared store such as Redis if you scale out.

## Project structure

```
api/           Vercel serverless entry point (index.js is the long-running equivalent)
auth/          Better Auth configuration (cookies, providers, session ownership)
routes/        URL to controller wiring
controllers/   Read the request, call a service, send the response
services/      Business logic (profile, account, avatar, email)
middleware/    requireAuth, validation, rate limiting, uploads, error handling
validators/    Zod schemas for request bodies
db/            Shared MongoDB client, collections, indexes
utils/         Environment, logger, AppError, image type detection
tests/         Vitest tests
```