## Agent Instructions

**CRITICAL:** Before starting ANY task — bug fixes, features, refactoring, debugging, UI work, deployment — you MUST evaluate whether any available skill applies. If a skill has even a 1% chance of relevance, invoke it immediately. Do not skip this step.

- **systematic-debugging**: Use for ANY bug, test failure, or unexpected behavior. Investigate root cause before proposing fixes.
- **test-driven-development**: Use before writing implementation code for any feature or bugfix.
- **brainstorming**: Use before creative work — features, components, functionality changes.
- **frontend-design**: Use for visual design, UI changes, styling work.
- **verification-before-completion**: Use before claiming work is complete — run checks, confirm output.
- **writing-plans**: Use for multi-step tasks before touching code.
- **vercel-react-best-practices**: Use when writing, reviewing, or refactoring React/Next.js code.
- **ui-ux-pro-max**: UI/UX design intelligence — use for UI patterns, component design.

**Rule:** When in doubt, invoke the skill. Skills override default behavior. User instructions always take highest priority.

# OpenCode Agent Instructions

## 🎯 Operational Mode
- **Look Before You Leap**: Always use `explore` or `scout` subagents to read existing code before writing patches.
- **Scope Contraction**: Write code in small, focused modules. Do not exceed 300 lines per file.
- **No Sweeping Changes**: Avoid repo-wide rewrites unless explicitly ordered.

## 🛠 Tech Stack & Coding Constraints
- **Language**: TypeScript (Strict Mode).
- **State Management**: MobX using `useLocalStore`.
- **Styling**: Emotion `css={{}}` prop format. Strictly use design tokens from `DynamicStyles.tsx`.
- **Error Handling**: Fail fast. Avoid generic try/catch blocks that hide broken functionality.
- **Type Safety**: Avoid using `any`. Rely on downstream type inference.

## ❌ Strict Don'ts
- **No Prose/Filler**: Never write Markdown TODO lists; track work programmatically.
- **No Comments**: Code must be self-explanatory. Avoid inline comments.
- **No Hardcoding**: Do not hardcode colors, dimensions, or magic strings.

## 🧪 Verification & Definition of Done
- **Evidence First**: You must run the localized test suite (`pnpm test`) to verify changes before declaring a task complete.
- **Linter Check**: Run `pnpm lint` and resolve formatting natively before finalizing diffs.
---

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
cd frontend && npm run build       # next build (includes linting)

# Database
docker compose up -d               # postgres:15 + supertokens-postgresql:7.0
```

**Verify before commit:** `npx tsc --noEmit` (backend) + `npm run build` (frontend).

## Local Dev Setup

1. `docker compose up -d` — starts Postgres on 5432 + SuperTokens on 3567
2. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`
3. Add `http://localhost:3000/api/auth/callback/google` and `http://localhost:3000/auth/callback` as Authorized redirect URIs in Google Cloud Console (production: use `https://pitchr.com.ng/api/auth/callback/google` and `https://pitchr.com.ng/auth/callback`)
4. `cd backend && npm run dev` — auto-runs migrations on start
5. `cd frontend && npm run dev`
6. Open `http://localhost:3000`

Both `.env` and `.env.local` are gitignored. Use `.env.example` as template.

## Mock Mode (No External Services)

Set these keys to skip real API calls:
- `DEEPSEEK_API_KEY=sk-placeholder` → returns mock proposals
- `FLUTTERWAVE_SECRET_KEY=sk_placeholder` → returns mock payment links (no redirect)
- `ZEPTOMAIL_API_KEY=placeholder` → skips email sending (logs instead)
- `GOOGLE_CLIENT_ID=placeholder` → disables Google OAuth

All configs are **lazy-loaded via getter functions** (`getDeepseekConfig()`, `getFlutterwaveConfig()`, etc.). Note: Flutterwave and DeepSeek configs are cached on first call — a server restart is required for env changes to take effect. Email config is not cached.

## Routes (Backend)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | none | DB health check |
| POST | `/api/auth/signup` | rateLimited | Create account (bcrypt, JWT cookie) |
| POST | `/api/auth/signin` | rateLimited | Sign in, returns `{ user, token }` |
| POST | `/api/auth/signout` | none | Clears cookie |
| POST | `/api/auth/google-finish` | none | Completes Google OAuth, issues JWT cookie |
| GET | `/api/user` | `requireAuth` | Returns all user fields including subscription |
| PATCH | `/api/user/profile` | `requireAuth` | Update first_name/last_name |
| GET | `/api/proposals` | `requireAuth` | User's proposals (dashboard) |
| POST | `/api/proposals/generate` | sessionToken or auth | Rate-limited, checks limits, auto-resets monthly |
| GET | `/api/sessions/active` | `requireAuth` | Returns user's active session (cross-device sync) |
| POST | `/api/sessions/claim` | none | Verifies payment with Flutterwave, creates session |
| POST | `/api/payments/init-session` | `requireAuth` | Returns Flutterwave payment link (uses user's email) |
| POST | `/api/payments/init-subscription` | `requireAuth` | Returns Flutterwave payment link |
| POST | `/api/payments/confirm-subscription` | `requireAuth` | Activates subscription after Flutterwave verification |
| POST | `/api/payments/cancel-subscription` | `requireAuth` | Sets tier to 'free' |
| POST | `/api/payments/webhook` | signature | Flutterwave webhook handler |
| GET | `/api/admin/analytics` | `requireAdmin` | Dashboard stats: users, proposals, revenue |
| GET | `/api/admin/users` | `requireAdmin` | Paginated user list with search |
| PATCH | `/api/admin/users/:id` | `requireAdmin` | Update user subscription, limits, ban |
| GET | `/api/admin/transactions` | `requireAdmin` | Paginated payment transaction history |

## Auth Flow

- JWT with 7-day expiry, stored in httpOnly cookie `pitchr_token`
- `requireAuth` middleware extracts `userId` from cookie or `Authorization: Bearer` header
- Token contains only `{ userId }` — no subscription data
- SuperTokens runs alongside custom auth at `/api/auth/*`; custom routes take priority
- Google OAuth: frontend uses `supertokens-web-js` to redirect → SuperTokens handles OAuth → callback page calls `POST /api/auth/google-finish` to issue JWT

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
starter: 30 proposals/month
pro:      0 = unlimited

// Limits auto-reset at month boundaries via atomic SQL in the generate route.
```

## Payment Reference Format

```
PROP_flash_<timestamp>      → session payment
PROP_power_<timestamp>      → session payment
PROP_SUB_starter_<timestamp> → subscription payment
PROP_SUB_pro_<timestamp>     → subscription payment
PROP_SUB_starter_annual_<timestamp> → subscription (annual)
PROP_SUB_pro_annual_<timestamp>     → subscription (annual)
```

## Key Conventions

- **DB column names** are `snake_case` everywhere (Postgres convention)
- **Backend API responses** return snake_case JSON (`first_name`, `subscription_tier`)
- **Zustand stores** use camelCase (`firstName`, `subscriptionTier`)
- **Error classes**: `AppError` → `ValidationError` (400), `UnauthorizedError` (401), `NotFoundError` (404), `ConflictError` (409), `PaymentError` (402)
- All errors go through `errorHandler` middleware — typed errors get proper status codes

## Database

Postgres 15 via docker-compose. Schema in `backend/src/database/schema.sql`. Migrations in `src/database/migrations/` (001-004) auto-run on server start.

Tables: `users`, `sessions`, `proposals`, `payments`, `audit_logs`

## Tests

Backend only. Vitest. 11 test suites across services, middleware, routes, config, database, and utils.

```bash
cd backend && npm test              # all tests
cd backend && npm run test:watch    # watch mode
```

CI: GitHub Actions runs backend build+test, frontend build. Deploy: `git pull && docker compose up -d --build` on VPS.

## Known Gotchas

- **Signout uses `window.location.href`** (full page navigation) — do not change to `router.push`. In-memory stores reset on full navigation, but `clearSession()` MUST be called to clear `localStorage`. Without it, the landing page shows "Continue" after signout.
- **Dashboard reads directly from store** (`subscriptionTier`, `proposalCount`, `proposalLimit`), NOT from a separate `stats` state. The store is populated by `useEffect` fetch on mount.
- **`confirm-subscription` requires auth** — the JWT cookie must be present. Works because user initiates payment while logged in and Flutterwave redirects back to same domain.
- **`cancelUserSubscription` sets tier to 'free'** — does NOT auto-renew or prorate.
- **Winston logs** to console + `logs/error.log` + `logs/combined.log` (gitignored).
- **`npx tsx` entry is `src/index.ts`**, not `src/server.ts`. The `server.ts` file exports `createApp()` — `index.ts` calls it after migrations.
