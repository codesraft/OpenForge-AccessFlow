# Architecture

```
Next.js client ──(fetch, credentials: include)──> Express + Better Auth ──> MongoDB
                                                        │
                                                        └──> Google OAuth, SMTP, imgBB
```

- **Better Auth** owns passwords, sessions, tokens, email verification, password reset and OAuth.
  No custom cryptography or session logic exists in this project.
- **Express** adds rate limiting, request validation, the profile and account endpoints and the
  shared error format.
- **The server is the security boundary.** The client route guard only decides what to show.

## Authentication flow

```
Login or Google callback
  -> Better Auth creates a session
  -> HttpOnly cookie is set
  -> request to a protected route
  -> requireAuth reads the session and checks the email is verified
  -> handler works on req.user (never on an id sent by the client)
```

Because handlers only use `req.user`, there is no user id in any URL or body, so one user cannot
ask for another user's profile or account.

## API

### Better Auth routes

| Method | Endpoint                            | Purpose                                |
| ------ | ----------------------------------- | -------------------------------------- |
| POST   | `/api/auth/sign-up/email`           | Register                               |
| POST   | `/api/auth/sign-in/email`           | Log in                                 |
| POST   | `/api/auth/sign-in/social`          | Start Google sign-in                   |
| POST   | `/api/auth/sign-out`                | Log out this device                    |
| GET    | `/api/auth/verify-email`            | Confirm an email (link from the email) |
| POST   | `/api/auth/send-verification-email` | Send a new verification link           |
| POST   | `/api/auth/request-password-reset`  | Email a reset link                     |
| POST   | `/api/auth/reset-password`          | Set a new password with the token      |
| POST   | `/api/auth/change-password`         | Change password (needs current one)    |
| GET    | `/api/auth/get-session`             | Current session, or `null`             |
| GET    | `/api/auth/list-sessions`           | Active sessions of the current user    |
| POST   | `/api/auth/revoke-session`          | Log out one device                     |
| POST   | `/api/auth/revoke-other-sessions`   | Log out every other device             |

### Routes added by this server

See the table in the README. All of them require a logged-in user with a verified email.

### Errors

Every error from the custom routes has the same shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": { "bio": "…" } } }
```

| Status | When                                              |
| ------ | ------------------------------------------------- |
| 400    | Invalid input (`details` names the fields)        |
| 401    | No valid session                                  |
| 403    | Email not verified, or someone else's session     |
| 404    | Unknown route                                     |
| 429    | Rate limit reached                                |
| 500    | Unexpected failure. Details are only in the logs. |

## Cross-origin cookies

When the client and server are on different sites (for example two `*.vercel.app` projects),
the browser only sends the session cookie if all of these are true:

1. The cookie has `SameSite=None` and `Secure` (this needs HTTPS). The server does this
   automatically when `NODE_ENV=production`, and refuses `COOKIE_SAME_SITE=none` without it.
2. CORS allows the client origin **and** `credentials: true`. Set `CLIENT_URL` exactly,
   with no trailing slash.
3. The client sends `credentials: 'include'` on every request.
4. Better Auth trusts the client origin. `CLIENT_URL` and `TRUSTED_ORIGINS` are passed to it.

Some browsers (Safari, and Chrome with third-party cookies blocked) refuse cookies set from a
different site even when the settings above are right. The most reliable fix is to serve the
client and the server from subdomains of the same domain, for example `app.example.com` and
`api.example.com`, then set `COOKIE_SAME_SITE=lax`.

## Common problems

| Symptom                                           | Likely cause                                                                       |
| ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Login works locally but not after deploying       | Cookie not `SameSite=None; Secure`, or `CLIENT_URL` does not match exactly         |
| Google login ends on the API domain               | `BETTER_AUTH_URL` or the Google redirect URI points at the wrong place             |
| Google error `redirect_uri_mismatch`              | Redirect URI in Google Console is not `<BETTER_AUTH_URL>/api/auth/callback/google` |
| Email links open the API instead of the client    | `CLIENT_URL` is not set to the client's public URL                                 |
| Every user gets "Too many attempts" on production | `trust proxy` needs `NODE_ENV=production` so real client IPs are used              |
| Logged-in user flashes the login page             | A route is redirecting before the session check finished. Use `ProtectedRoute`.    |

## Reusing the pieces

- **Another Express app:** copy `auth/`, `middleware/` and `utils/`, mount the Better Auth handler
  before `express.json()`, then add your own routers behind `createRequireAuth(auth)`.
- **Another client:** any frontend can call the API with `credentials: 'include'`. The Next.js
  client's `ProtectedRoute`, `useSession` and the forms in `components/auth` are written to be
  copied into other projects.
