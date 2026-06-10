# Pitchr — AI Proposal Generator (MVP)

## Architecture

```
backend/    Express + TypeScript, tsx runner, PostgreSQL + SuperTokens
frontend/   Next.js 14 App Router, Zustand, Tailwind (emerald/teal)
```

Both packages run independently. No monorepo tool — `npm run dev` in each.

## Entry Points

| Layer | File | Role |
|---|---|---|
| Backend | `src/index.ts` | Runs migrations, calls `createApp()`, starts server on PORT (5001) |
| Backend | `src/server.ts` | Express app factory: routes, middleware, CORS, error handler |
| Frontend | `src/app/layout.tsx` | Root layout — no providers, just ToastContainer |
| Frontend | `src/app/page.tsx` | Landing page (static) |
| Frontend | `src/lib/api.ts` | Axios instance + `generateProposal()`, `initSessionPayment()` |

## Developer Commands

```bash
# Backend
cd backend && npm run dev          # tsx watch src/index.ts (hot reload)
cd backend && npx tsc --noEmit     # typecheck only
cd backend && npm test             # vitest run
cd backend && npm run build        # tsc → dist/

# Frontend
cd frontend && npm run dev         # next dev (port 3000)
cd frontend && npm run build       # next build (includes lint + typecheck)

# Database
docker compose up -d               # postgres:15 + supertokens-postgresql:7.0
```

**Verify before commit:** `npx tsc --noEmit` (backend) + `npm run build` (frontend).

## Local Dev Setup

1. `docker compose up -d` — starts Postgres on 5432 + SuperTokens on 3567
2. `cd backend && npm run dev` — auto-runs migrations on start
3. `cd frontend && npm run dev`
4. Open `http://localhost:3000`

Both `.env` and `.env.local` are gitignored. Use `.env.example` as template.

## Mock Mode (No External Services)

Set these keys to skip real API calls:
- `DEEPSEEK_API_KEY=sk-placeholder` → returns mock proposals
- `FLUTTERWAVE_SECRET_KEY=sk_placeholder` → returns mock payment links (no redirect)
- `ZEPTOMAIL_API_KEY=placeholder` → skips email sending (logs instead)
- `GOOGLE_CLIENT_ID=placeholder` → disables Google OAuth

All configs are **lazy-loaded via getter functions** (`getDeepseekConfig()`, `getFlutterwaveConfig()`, etc.) — env changes take effect without server restart.

## Routes (Backend)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | none | DB health check |
| POST | `/api/auth/signup` | none | Create account (bcrypt, JWT cookie) |
| POST | `/api/auth/signin` | none | Sign in, returns `{ user, token }` |
| POST | `/api/auth/signout` | none | Clears cookie |
| GET | `/api/user` | `requireAuth` | Returns all user fields including subscription |
| PATCH | `/api/user/profile` | `requireAuth` | Update first_name/last_name |
| GET | `/api/proposals` | `requireAuth` | User's proposals (dashboard) |
| POST | `/api/proposals/generate` | sessionToken or auth | Rate-limited, checks limits |
| POST | `/api/sessions/claim` | none | Creates session with `payment_status=completed` |
| POST | `/api/payments/init-session` | none | Returns Flutterwave payment link |
| POST | `/api/payments/init-subscription` | `requireAuth` | Returns Flutterwave payment link |
| POST | `/api/payments/confirm-subscription` | `requireAuth` | Activates subscription in DB |
| POST | `/api/payments/cancel-subscription` | `requireAuth` | Sets tier to 'free' |
| POST | `/api/payments/webhook` | signature | Flutterwave webhook handler |

## Auth Flow

- JWT with 7-day expiry, stored in httpOnly cookie `pitchr_token`
- `requireAuth` middleware extracts `userId` from cookie or `Authorization: Bearer` header
- Token contains only `{ userId }` — no subscription data
- SuperTokens runs alongside custom auth at `/api/auth/*`; custom routes take priority

## Frontend State

| Store | Persistence | Notes |
|---|---|---|
| `useSessionStore` | localStorage (`pitchr_session`) | Token, plan, expiry, usage. Calls `rehydrate()` on mount. |
| `useUserStore` | **in-memory only** | Resets to `subscriptionTier: 'free'` on refresh. Dashboard always fetches `GET /api/user` on mount. |
| `useToastStore` | in-memory | Auto-dismisses after 4s |

**Gotcha:** `userStore` has no persistence. After login/signup, the login page calls `setUser()` from the response, but the dashboard re-fetches `/api/user` anyway. Do not rely on store being populated on direct navigation — always fetch.

## Subscription & Session Limits

```typescript
// Session limits (backend/src/services/sessionService.ts)
flash:  5 proposals, 30 min duration
power: 20 proposals, 4 hour duration

// Subscription limits (backend/src/database/queries.ts)
starter: 10 proposals/month
pro:      0 = unlimited
ultra:    0 = unlimited
```

## Payment Reference Format

```
PROP_flash_<timestamp>      → session payment
PROP_power_<timestamp>      → session payment
PROP_SUB_starter_<timestamp> → subscription payment
PROP_SUB_pro_<timestamp>     → subscription payment
PROP_SUB_ultra_<timestamp>   → subscription payment
```

## Key Conventions

- **DB column names** are `snake_case` everywhere (Postgres convention)
- **Backend API responses** return snake_case JSON (`first_name`, `subscription_tier`)
- **Zustand stores** use camelCase (`firstName`, `subscriptionTier`)
- **Error classes**: `AppError` → `ValidationError` (400), `UnauthorizedError` (401), `NotFoundError` (404), `ConflictError` (409), `PaymentError` (402)
- All errors go through `errorHandler` middleware — typed errors get proper status codes

## Database

Postgres 15 via docker-compose. Schema in `backend/src/database/schema.sql`. Migrations in `src/database/migrations/001_init.sql` auto-run on server start.

Tables: `users`, `sessions`, `proposals`, `payments`, `audit_logs`

## Tests

Backend only. Vitest. Single test file: `src/services/__tests__/proposalEngine.test.ts`.

```bash
cd backend && npm test              # all tests
cd backend && npm run test:watch    # watch mode
```

CI: GitHub Actions runs backend build+test, frontend build. Deploy: Coolify webhook on push to `main`.

## Known Gotchas

- **Signout uses `window.location.href`** (full page navigation) — do not change to `router.push`. In-memory stores reset on full navigation, no need to call `clearUser()`/`clearSession()`.
- **Dashboard reads directly from store** (`subscriptionTier`, `proposalCount`, `proposalLimit`), NOT from a separate `stats` state. The store is populated by `useEffect` fetch on mount.
- **`confirm-subscription` requires auth** — the JWT cookie must be present. Works because user initiates payment while logged in and Flutterwave redirects back to same domain.
- **`cancelUserSubscription` sets tier to 'free'** — does NOT auto-renew or prorate.
- **Winston logs** to console + `logs/error.log` + `logs/combined.log` (gitignored).
- **`npx tsx` entry is `src/index.ts`**, not `src/server.ts`. The `server.ts` file exports `createApp()` — `index.ts` calls it after migrations.
