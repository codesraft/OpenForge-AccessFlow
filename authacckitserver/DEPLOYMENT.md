# Deploying to Vercel

Deploy the server first, then the client. Both are separate Vercel projects.

## 1. Server project

Import the server repository. `vercel.json` already routes every request to `api/index.js`
and turns off framework detection, so no build settings are needed.

Add these in **Settings → Environment Variables** (Production), then **redeploy**. Variables only
reach deployments made after they are saved.

| Variable                                    | Value                                                                   |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`                              | MongoDB Atlas connection string, including the database name            |
| `BETTER_AUTH_SECRET`                        | Long random string (`openssl rand -base64 32`)                          |
| `BETTER_AUTH_URL`                           | The server's own public URL, for example `https://my-server.vercel.app` |
| `CLIENT_URL`                                | The client's public URL, with no trailing slash                         |
| `SMTP_URL`                                  | Your email provider's SMTP URL                                          |
| `EMAIL_FROM`                                | Sender address on a verified domain                                     |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Only if you use Google sign-in                                          |
| `IMGBB_API_KEY`                             | Only if you use avatar uploads                                          |

Vercel sets `NODE_ENV=production` itself.

In **MongoDB Atlas → Network Access**, allow `0.0.0.0/0`. Vercel's outgoing IP addresses change,
so a fixed allow-list will not work.

Check: open `https://<server>/api/health`. It should answer `{ "status": "ok" }`.

## 2. Client project

Set `NEXT_PUBLIC_API_URL` to the server URL, then deploy. This value is baked into the build, so
changing it needs a new deployment.

Then set the server's `CLIENT_URL` to the client's final URL and redeploy the server.

### Optional: same-origin mode

Two `*.vercel.app` projects are different sites, and some browsers block their cookies. To avoid
that, let the client forward `/api/*` to the server:

- Client: `API_PROXY_TARGET` = server URL, and `NEXT_PUBLIC_API_URL` = the client's own URL.
- Server: `BETTER_AUTH_URL` = the client's URL, so email links and the Google callback go through
  the client domain.
- Google redirect URI: `https://<client>/api/auth/callback/google`.

## Reading the logs

| Log message                                         | Meaning and fix                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| `Missing environment variables: …`                  | Add the listed variables and redeploy                             |
| `Invalid export found in module "/var/task/app.js"` | An old deployment. The entry point is `api/index.js`              |
| `MongoServerSelectionError`                         | Atlas Network Access does not allow Vercel                        |
| `Could not start the server: …`                     | The reason follows the colon. The browser only sees a generic 500 |