# AuthAccKit (OpenForge AccessFlow)

AuthAccKit is a reusable authentication and account management kit built with **Next.js, Express, Better Auth, and MongoDB**. It provides common authentication and account-lifecycle features that can be integrated into other projects without building everything from scratch.

The project uses Better Auth to handle security-sensitive operations such as password management, sessions, tokens, and OAuth rather than implementing custom cryptography.


## Features

- Email and password registration with email verification
- Login, logout, and Google sign-in
- Forgot password, reset password, and change password
- Protected routes with session checking
- Profile management with avatar uploads
- Multi-device session management and session revocation
- Log out other devices
- Account deletion with confirmation
- Rate limiting for sensitive authentication operations
- Reusable authentication forms, hooks, and UI components

## Tech Stack

- **Frontend:** Next.js, React, TanStack Query
- **Backend:** Node.js, Express
- **Authentication:** Better Auth
- **Database:** MongoDB
- **Validation:** Zod
- **Avatar Uploads:** ImgBB
- **Email:** SMTP / Resend
- **Testing:** Vitest, Playwright
- **Deployment:** Vercel, MongoDB Atlas

## Project Structure

```text
AuthAccKit/
├── authacckitserver/
│   ├── README.md
│   └── ...
├── authappkitclient/
│   ├── README.md
│   └── ...
├── DEPLOYMENT.md
└── README.md
```

The client and server are maintained separately, with their own dependencies, environment configurations, tests, and CI workflows. They can also be moved into separate repositories if needed.

## Documentation

- **[Server Documentation](authacckitserver/README.md)** — Server setup, environment variables, authentication configuration, API endpoints, and backend scripts.
- **[Client Documentation](authappkitclient/README.md)** — Frontend setup, available scripts, reusable components, and client configuration.
- **[Deployment Guide](DEPLOYMENT.md)** — Deployment instructions, environment configuration, cookie settings, and production checklist.

## Quick Start

**1. Start the server**

```bash
cd authacckitserver
npm install
cp .env.example .env
npm run dev
```

Configure the required environment variables before starting the server.

**2. Start the client in a separate terminal**

```bash
cd authappkitclient
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

The server runs on `http://localhost:5000` by default. During local development, verification and password reset links are printed in the server terminal when `SMTP_URL` is not configured.

For complete setup instructions and environment variable details, refer to the client and server READMEs.

## Security Notes

- Better Auth handles authentication-sensitive operations.
- Sensitive authentication endpoints use rate limiting.
- Session ownership checks help prevent users from revoking other users' sessions.
- Production deployments require appropriate HTTPS, cookie, and origin configurations.
- The current rate limiter stores counters in memory. A shared store such as Redis is recommended when consistent rate limiting is needed across multiple instances.
- Never commit secrets, credentials, or production environment files.

