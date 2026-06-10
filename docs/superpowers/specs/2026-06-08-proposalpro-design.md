# ProposalPro — Design Document

**Status:** Approved
**Date:** 2026-06-08

## Overview

ProposalPro is a micro-SaaS proposal generation tool for Nigerian freelancers on Upwork and Fiverr. Users generate winning proposals in ~30 seconds via AI (DeepSeek). Monetized via pay-per-session (Flash ₦500, Power ₦1,200) and monthly subscriptions (Starter ₦2k, Pro ₦3.5k, Ultra ₦5k).

## Design Decisions

### Visual Identity
- **Style:** Minimal Monochrome (black/white/gray, ultra-clean, fast-loading)
- **Inspired by:** Utility-first design — no decorative frills, pure function
- **Font:** System UI stack (system-ui, -apple-system, sans-serif)

### Pricing Display
- **Layout C: Toggle View** — Session/Monthly toggle tabs
- Session plans side-by-side (Flash vs Power), monthly plans similarly toggled
- Keeps UI clean and avoids overwhelming with 5 plans at once

### Proposal Generator
- **Layout A: Full-Page Form** — Dedicated page for proposal generation
- Input: job description textarea, platform dropdown, length dropdown
- Output displayed below form after generation
- Copy + re-generate buttons on output

### Infrastructure Approach
- **Local-first with stubs** — build everything to work locally with mock/test keys
- Docker Compose for local dev (PostgreSQL + SuperTokens)
- Deploy to Hetzner CX23 via Coolify in later phase

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS v3, shadcn/ui |
| Backend | Express.js 4.18+, TypeScript, Node 20 LTS |
| Database | PostgreSQL 15 (via pg driver) |
| Auth | SuperTokens (self-hosted, email/password + Google OAuth) |
| AI | DeepSeek API (deepseek-chat model) |
| Payments | Flutterwave SDK (NGN only) |
| Email | Nodemailer + Zoho SMTP |
| Logging | Winston + GlitchTip |
| Hosting | Docker → Coolify → Hetzner CX23 |

## Project Structure

```
proposalpro/
├── frontend/          # Next.js 14 app
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── session/           # Proposal generator (no login)
│   │   ├── auth/              # Login/signup/OAuth callback
│   │   └── dashboard/         # Dashboard (auth required)
│   ├── components/
│   │   ├── ProposalGenerator.tsx
│   │   ├── ProposalCard.tsx
│   │   ├── PaymentModal.tsx
│   │   ├── Header.tsx / Footer.tsx
│   │   └── ui/                # shadcn components
│   ├── hooks/                 # useSession, useUser, useProposal
│   ├── lib/                   # API client, validators, constants
│   ├── store/                 # Zustand stores (sessionStore, userStore)
│   └── styles/globals.css
│
├── backend/           # Express.js server
│   ├── src/
│   │   ├── index.ts / server.ts
│   │   ├── config/            # database, deepseek, flutterwave, email, supertokens
│   │   ├── routes/            # proposals, payments, auth, user, health
│   │   ├── services/          # proposalEngine, deepseekService, paymentService, etc.
│   │   ├── database/          # schema.sql, migrations, queries.ts
│   │   ├── middleware/        # auth, errorHandler, logger, rateLimit
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # logger, errors, validators, crypto
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── .github/workflows/         # test.yml, deploy.yml
└── README.md
```

## Database Schema

5 tables: `users`, `sessions`, `proposals`, `payments`, `audit_logs`

- **users** — Full user profile with subscription tier, monthly limits, soft delete
- **sessions** — Anonymous session tokens for Flash/Power users (time-limited)
- **proposals** — Generated proposals linked to user or session
- **payments** — Transaction log for both one-time and subscription payments
- **audit_logs** — JSONB metadata for tracking actions

All tables use UUID primary keys, RLS enabled in production.

## API Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /api/proposals/generate | Session or User | Generate proposal via DeepSeek |
| POST | /api/payments/init-session | None | Create Flash/Power payment link |
| POST | /api/payments/init-subscription | SuperTokens | Create subscription payment |
| POST | /api/payments/webhook | Signature | Flutterwave callback |
| GET | /api/proposals | SuperTokens | List saved proposals |
| POST | /api/proposals/:id/save | SuperTokens | Save/favorite a proposal |
| GET | /api/user | SuperTokens | User profile + subscription |
| POST | /api/user/cancel-subscription | SuperTokens | Cancel recurring billing |
| GET | /api/health | None | Health check (DB, DeepSeek, Flutterwave) |

## AI Integration

- **Model:** deepseek-chat
- **Temperature:** 0.7
- **System prompt:** Professional Nigerian proposal writer persona
  - No clichés ("I am passionate", "look no further")
  - Open with specific insight from job listing
  - Professional Nigerian English, contractions OK
  - No time zone mention unless client asks
  - Upwork: detailed (250 words), Fiverr: punchy (150 words)
  - End with confident next step, never a question
- **Rate limit:** 1 req / 2 seconds (free tier), queue for fallback
- **Max tokens:** wordLimit * 1.3

## Payment Flow

```
Generate → No session? → Show toggle pricing (Session↔Monthly)
  ↓
Select Flash/Power → Flutterwave modal → Payment
  ↓
Webhook received → Create session with token
  ↓
Frontend stores token → Enable generation
  ↓
Timer counts down → Proposals used increments
  ↓
Expiry → Clear token → Redirect to pricing
```

## Data Flow

**Session (anonymous):**
Browser → Landing/Generator form → POST /api/proposals/generate → Express validates session token → DeepSeek generates → Return proposal → Frontend displays with copy/re-spin

**Subscription (authenticated):**
Browser → Auth (SuperTokens) → Dashboard → Generate → Express checks subscription limits → DeepSeek generates → Save to dashboard → View history

## Error Handling Strategy

- **DeepSeek failures:** Retry 3x with exponential backoff → graceful fallback message
- **Payment webhooks:** Idempotent via flutterwave_reference unique constraint
- **Rate limiting:** express-rate-limit (5/min anonymous, 60/min subscribers)
- **Input validation:** Zod schemas on all POST endpoints
- **Auth failures:** SuperTokens session middleware → 401 → frontend redirects
- **Logging:** Winston (file + console) + GlitchTip (error capture)

## Build Phases

### Phase 1: Backend (Week 1)
1. Express + TypeScript scaffold
2. PostgreSQL schema + migrations
3. DeepSeek integration + proposal engine
4. Proposal generation endpoint
5. SuperTokens auth setup
6. Flutterwave payment endpoints + webhook
7. Session token management
8. Email service (Nodemailer)
9. Error tracking + Winston logging
10. Health endpoint

### Phase 2: Frontend (Week 2)
1. Next.js scaffold + Tailwind + shadcn/ui
2. Landing page (monochrome style)
3. Proposal generator page (full-page form)
4. Payment flow (Flutterwave modal)
5. Auth UI (login/signup/Google OAuth)
6. Dashboard (proposals, subscription, settings)
7. Zustand state management
8. API client + auth header injection
9. Responsive mobile-first design

### Phase 3: Integration + Deploy (Week 3-4)
1. Docker + docker-compose
2. GitHub Actions CI/CD
3. Environment config
4. Database migrations automation
5. Monitoring (GlitchTip + Umami)
6. Testing (unit + integration + E2E)
7. Production deployment (Hetzner → Coolify)
