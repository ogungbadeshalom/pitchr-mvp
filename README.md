# Pitchr — AI Proposal Generator

Write proposals that actually get replies. Pitchr is built for Nigerian freelancers on Upwork and Fiverr. Paste a job description, get a winning proposal written from your real profile — no templates, no clichés, no wasted connects.

## Features

- **AI built for Upwork & Fiverr** — knows the difference between a Fiverr gig pitch and an Upwork cover letter. Writes the right length, tone, and structure for each platform.
- **Writes from your real profile** — pulls from your actual experience, not generic templates. Every proposal sounds like you.
- **30 seconds, not 30 minutes** — paste a job description, pick your platform, and get a ready-to-send proposal.
- **Re-spin until it hits** — don't like the angle? Hit re-spin for a different hook, approach, or close. No extra charge.
- **Pay as you go or subscribe** — try with a single session at ₦500. Upgrade to monthly if you're serious. No lock-in.
- **Flutterwave payments** — card, USSD, bank transfer. Naira only. No dollar card needed.
- **Dark mode** — toggleable light/dark theme.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand |
| Backend | Express, TypeScript, tsx runner |
| Database | PostgreSQL 15 |
| Auth | Custom JWT + SuperTokens (Google OAuth) |
| AI | DeepSeek API |
| Payments | Flutterwave |
| Email | Zeptomail |
| Deployment | Coolify |

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Shalomhatesjavascript/pitchr-mvp.git
cd pitchr-mvp
```

### 2. Start the database and SuperTokens

```bash
docker compose up -d
```

This starts PostgreSQL on port 5432 and SuperTokens on port 3567.

### 3. Set up the backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The backend starts on port 5001. Migrations run automatically on first start.

### 4. Set up the frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

The frontend starts on port 3000. Open http://localhost:3000.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5001) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `DEEPSEEK_API_KEY` | DeepSeek API key for AI proposals |
| `FLUTTERWAVE_PUBLIC_KEY` | Flutterwave public key |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave secret key |
| `SUPERTOKENS_URI` | SuperTokens connection URI |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `ZEPTOMAIL_API_KEY` | Zeptomail API key |
| `FRONTEND_URL` | Frontend URL for CORS (default: http://localhost:3000) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: http://localhost:5001) |

## Mock Mode (No External Services)

Set these placeholder values in `backend/.env` to skip real API calls:

| Key | Value | Effect |
|---|---|---|
| `DEEPSEEK_API_KEY` | `sk-placeholder` | Returns mock proposals |
| `FLUTTERWAVE_SECRET_KEY` | `sk_placeholder` | Returns mock payment links (no redirect) |
| `ZEPTOMAIL_API_KEY` | `placeholder` | Skips email sending (logs instead) |
| `GOOGLE_CLIENT_ID` | `placeholder` | Disables Google OAuth |

Config values are lazy-loaded via getter functions — changes take effect without a server restart.

## Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create an OAuth 2.0 client ID (Web application)
3. Add authorized redirect URIs:
   - `http://localhost:3567/auth/callback/google`
   - `http://localhost:3000/auth/callback`
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`

## Usage

### Session (Pay as You Go)

No account required. Enter your email, pay with Flutterwave, and get a session token stored in your browser.

| Plan | Price | Proposals | Duration |
|---|---|---|---|
| Flash | ₦500 | 5 | 30 minutes |
| Power | ₦1,200 | 20 | 4 hours |

### Subscription (Monthly)

Requires an account. Sign up, subscribe, and generate proposals all month.

| Plan | Price | Proposals |
|---|---|---|
| Starter | ₦2,000/mo | 10 per month |
| Pro | ₦3,500/mo | Unlimited |
| Ultra | ₦5,000/mo | Unlimited + 3 team seats |

### Session persistence

Session data is saved to `localStorage`. Close the tab and come back — if the timer hasn't expired, your session is still active.

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # Lazy-loaded config getters
│   │   ├── database/        # Schema, migrations, queries
│   │   ├── middleware/       # Auth middleware, error handler
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic, proposal engine
│   │   ├── types/           # TypeScript definitions
│   │   ├── utils/           # Helpers (JWT, rate limit)
│   │   ├── index.ts         # Entry point
│   │   └── server.ts        # Express app factory
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # API client, SuperTokens config
│   │   └── store/           # Zustand stores
│   └── .env.local
├── docker-compose.yml       # PostgreSQL + SuperTokens
└── AGENTS.md                # Development reference
```

## Scripts

### Backend

| Command | Description |
|---|---|
| `npm run dev` | Start with hot reload (tsx watch) |
| `npx tsc --noEmit` | TypeScript typecheck only |
| `npm run build` | Compile TypeScript to dist/ |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Tests in watch mode |

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Next.js dev server (port 3000) |
| `npm run build` | Production build (includes lint + typecheck) |
| `npm start` | Start production server |

## API Routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | None | Database health check |
| POST | `/api/auth/signup` | None | Create account |
| POST | `/api/auth/signin` | None | Sign in |
| POST | `/api/auth/signout` | None | Clear session |
| GET | `/api/user` | Required | Get user profile + subscription |
| PATCH | `/api/user/profile` | Required | Update profile |
| GET | `/api/proposals` | Required | List user's proposals |
| POST | `/api/proposals/generate` | Session token or auth | Generate a proposal |
| POST | `/api/sessions/claim` | None | Claim a paid session |
| POST | `/api/payments/init-session` | None | Get Flutterwave payment link |
| POST | `/api/payments/init-subscription` | Required | Get subscription payment link |
| POST | `/api/payments/confirm-subscription` | Required | Activate subscription |
| POST | `/api/payments/cancel-subscription` | Required | Downgrade to free |
| POST | `/api/payments/webhook` | Signature | Flutterwave webhook |

## Deployment

The project deploys via Coolify on push to the `main` branch. GitHub Actions runs CI (backend build + test, frontend build).

### Verify before pushing

```bash
cd backend && npx tsc --noEmit
cd frontend && npm run build
```

## License

MIT
