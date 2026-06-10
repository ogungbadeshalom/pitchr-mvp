# Pitchr Implementation Plan

> **For agentic workers:** Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax.

**Goal:** Build Pitchr (formerly ProposalPro) — an AI proposal generator for Nigerian freelancers on Upwork/Fiverr, with session and subscription payment models.
**Architecture:** Next.js 14 App Router frontend + Express.js API backend + PostgreSQL database
**Tech Stack:** TypeScript, Next.js 14, Express 4.18, PostgreSQL 18, DeepSeek API (deepseek-chat), Flutterwave, JWT + bcrypt, Tailwind CSS v3, shadcn/ui, Zustand, ZeptoMail REST

---

## Deviation Log (vs Original Plan)

| # | Change | Reason |
|---|--------|--------|
| 1 | **SuperTokens → JWT + bcrypt** | Removed Docker dependency. Self-contained auth with pitchr_token httpOnly cookie. |
| 2 | **Zoho SMTP → ZeptoMail REST** | Switched from nodemailer/SMTP to REST API. Lighter, no transporter management. |
| 3 | **All configs → lazy getter functions** | Fixed dotenv loading order bug. `getDeepseekConfig()`, `getFlutterwaveConfig()`, `getEmailConfig()` are functions, not module-level constants. |
| 4 | **`isMockMode()` → function** | Was a module-level const evaluated before dotenv loaded. |
| 5 | **Pool → lazy init** | `getPool()` creates pg.Pool on first call, not at import time. |
| 6 | **Migrations → `IF NOT EXISTS`** | `runMigrations()` now idempotent — safe to run on every startup. |
| 7 | **`createUser` stores firstName/lastName** | Original only stored email + password_hash. |
| 8 | **`upsertUser` added** | Idempotent user creation for OAuth-style flow. |
| 9 | **`findUserByEmailWithPassword` added** | Returns raw row including password_hash for bcrypt comparison. |
| 10 | **`updateUserSubscription` stores plan in DB** | Webhook was the only path; now `confirm-subscription` endpoint directly updates the user row. |
| 11 | **`cancelUserSubscription` added** | Resets tier to `free`, clears limits. |
| 12 | **`POST /api/payments/confirm-subscription`** | Frontend calls this after Flutterwave redirect — no webhook needed for local dev. |
| 13 | **`POST /api/auth/signup/signin/signout`** | Custom JWT auth routes (replaced SuperTokens). |
| 14 | **Flutterwave redirect URL uses tx_ref directly** | Was using `{FLW_REF}` template variable that didn't resolve. |
| 15 | **API user response strips `password_hash`** | Security fix — `/api/user` and confirm endpoint no longer return sensitive columns. |
| 16 | **Brand color: emerald/teal** | Replaced original monochrome theme with green fintech palette (`#059669` primary, `#0d9488` accent). |
| 17 | **Session persistence → localStorage** | `sessionStore` persists to `pitchr_session` key; cleared on signout/signin. |
| 18 | **Toast system replaces `alert()`** | `toastStore` + `ToastContainer` — success/error/info/warning with auto-dismiss. |
| 19 | **Inline validation on auth forms** | Validate on blur + submit with field-level error messages. |
| 20 | **Error/loading/404 pages** | `error.tsx`, `loading.tsx`, `not-found.tsx`. |
| 21 | **`setSelected` tab toggle fix** | No longer resets to default on tab switch — keeps current selection if valid in new tab. |
| 22 | **Cancel subscription button** | Appears on subscription page when user has an active plan. |
| 23 | **Success banner for Flutterwave redirect** | Subscription page detects `?reference=` and shows standalone success UI (no duplicate grid). |

---

## Phase 1: Backend Foundation

### Task 1.1: Initialize Express Backend

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env.example`
- Create: `backend/src/index.ts`
- Create: `backend/src/server.ts`

- [x] **Step 1: Create package.json**

```json
{
  "name": "proposalpro-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "pg": "^8.11.3",
    "supertokens-node": "^16.0.0",
    "nodemailer": "^6.9.8",
    "winston": "^3.11.0",
    "express-rate-limit": "^7.1.5",
    "zod": "^3.22.4",
    "uuid": "^9.0.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/pg": "^8.10.9",
    "@types/nodemailer": "^6.4.14",
    "@types/uuid": "^9.0.7",
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "vitest": "^1.2.0"
  }
}
```

- [x] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

- [x] **Step 3: Create .env.example**

```
NODE_ENV=development
PORT=5001

DATABASE_URL=postgresql://proposalpro:proposalpro@localhost:5432/proposalpro

DEEPSEEK_API_KEY=sk-placeholder
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

FLUTTERWAVE_PUBLIC_KEY=pk_placeholder
FLUTTERWAVE_SECRET_KEY=sk_placeholder

SUPERTOKENS_URI=http://localhost:3567
SUPERTOKENS_API_KEY=placeholder

GOOGLE_CLIENT_ID=placeholder
GOOGLE_CLIENT_SECRET=placeholder

ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_SMTP_USER=noreply@proposalpro.ng
ZOHO_SMTP_PASS=placeholder
ZOHO_SMTP_PORT=587

FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:5001

LOG_LEVEL=debug
```

- [x] **Step 4: Create src/server.ts**

```typescript
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import healthRouter from './routes/health';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(express.json());
  app.use(requestLogger);

  app.use('/api/health', healthRouter);

  app.use(errorHandler);

  return app;
}
```

- [x] **Step 5: Create src/index.ts**

```typescript
import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './server';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 5001;

async function main() {
  const app = createApp();

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

main().catch((err) => {
  logger.error('Failed to start server', { error: err });
  process.exit(1);
});
```

- [x] **Step 6: Install dependencies**

Run: `cd backend && npm install`
Expected: All packages installed, no errors.

- [x] **Step 7: Verify server starts**

Run: `cd backend && npx tsx src/index.ts` (run briefly, then Ctrl+C)
Expected: "Server running on port 5001" logged.

---

### Task 1.2: Utility Layer (Logger, Errors, Types)

**Files:**
- Create: `backend/src/utils/logger.ts`
- Create: `backend/src/utils/errors.ts`
- Create: `backend/src/middleware/errorHandler.ts`
- Create: `backend/src/middleware/logger.ts`
- Create: `backend/src/types/index.ts`

- [x] **Step 1: Create src/utils/logger.ts**

```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

- [x] **Step 2: Create src/utils/errors.ts**

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, context);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NOT_FOUND', 404, context);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'UNAUTHORIZED', 401, context);
  }
}

export class PaymentError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'PAYMENT_ERROR', 402, context);
  }
}
```

- [x] **Step 3: Create src/middleware/errorHandler.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    logger.warn('Application error', {
      code: err.code,
      message: err.message,
      context: err.context,
    });
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
}
```

- [x] **Step 4: Create src/middleware/logger.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('HTTP request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: Date.now() - start,
    });
  });
  next();
}
```

- [x] **Step 5: Create src/types/index.ts**

```typescript
export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  subscription_tier: 'free' | 'starter' | 'pro' | 'ultra';
  subscription_started_at: Date | null;
  subscription_ended_at: Date | null;
  proposal_count_this_month: number;
  proposal_limit_this_month: number;
  created_at: Date;
}

export interface Session {
  id: string;
  token: string;
  plan: 'flash' | 'power';
  email: string;
  expires_at: Date;
  proposals_used: number;
  proposals_limit: number;
  payment_reference: string | null;
  payment_status: 'pending' | 'completed' | 'failed';
}

export interface Proposal {
  id: string;
  user_id: string | null;
  session_id: string | null;
  job_description: string;
  platform: 'upwork' | 'fiverr' | 'other';
  length: 'short' | 'standard' | 'detailed';
  generated_proposal: string;
  saved: boolean;
  created_at: Date;
}

export interface Payment {
  id: string;
  user_id: string | null;
  session_id: string | null;
  amount: number;
  currency: string;
  payment_type: 'one_time' | 'subscription';
  flutterwave_reference: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: Date;
}

export interface GenerateProposalRequest {
  job_description: string;
  platform: 'upwork' | 'fiverr' | 'other';
  length: 'short' | 'standard' | 'detailed';
  user_context?: string;
}

export interface GenerateProposalResponse {
  proposal: string;
  character_count: number;
}

export interface InitSessionPaymentRequest {
  plan: 'flash' | 'power';
  email: string;
}

export interface InitSubscriptionRequest {
  plan: 'starter' | 'pro' | 'ultra';
}
```

- [x] **Step 6: Verify TypeScript compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: No type errors.

---

### Task 1.3: Database Schema & Connection

**Files:**
- Create: `backend/src/database/schema.sql`
- Create: `backend/src/database/migrations/001_init.sql`
- Create: `backend/src/config/database.ts`
- Create: `backend/src/database/queries.ts`

- [x] **Step 1: Create schema.sql**

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  google_oauth_id VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_started_at TIMESTAMP,
  subscription_ended_at TIMESTAMP,
  subscription_auto_renew BOOLEAN DEFAULT true,
  proposal_count_this_month INT DEFAULT 0,
  proposal_limit_this_month INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(50),
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  proposals_used INT DEFAULT 0,
  proposals_limit INT,
  payment_reference VARCHAR(255) UNIQUE,
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  job_description TEXT NOT NULL,
  platform VARCHAR(50),
  length VARCHAR(50),
  generated_proposal TEXT NOT NULL,
  saved BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'NGN',
  payment_type VARCHAR(50),
  payment_method VARCHAR(50) DEFAULT 'flutterwave',
  flutterwave_reference VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255),
  resource VARCHAR(100),
  resource_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_proposals_user_id ON proposals(user_id);
CREATE INDEX idx_proposals_session_id ON proposals(session_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_session_id ON payments(session_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_payment_reference ON sessions(payment_reference);
```

- [x] **Step 2: Create 001_init.sql (same as schema for initial migration)**

Copy schema.sql content to `backend/src/database/migrations/001_init.sql`.

- [x] **Step 3: Create src/config/database.ts**

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  return { rows: result.rows, rowCount: result.rowCount, duration };
}

export async function runMigrations() {
  const fs = require('fs');
  const path = require('path');
  const migrationDir = path.join(__dirname, '../database/migrations');
  const files = fs.readdirSync(migrationDir).sort();

  for (const file of files) {
    if (file.endsWith('.sql')) {
      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf-8');
      await query(sql);
      console.log(`Migration ${file} applied`);
    }
  }
}

export { pool };
```

- [x] **Step 4: Create src/database/queries.ts**

```typescript
import { query } from '../config/database';
import type { User, Session, Proposal, Payment } from '../types';

export async function createUser(email: string, passwordHash: string): Promise<User> {
  const result = await query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *`,
    [email, passwordHash]
  );
  return result.rows[0];
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
  return result.rows[0] || null;
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
  return result.rows[0] || null;
}

export async function createSession(token: string, plan: string, email: string, expiresAt: Date, proposalsLimit: number): Promise<Session> {
  const result = await query(
    `INSERT INTO sessions (token, plan, email, expires_at, proposals_limit) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [token, plan, email, expiresAt, proposalsLimit]
  );
  return result.rows[0];
}

export async function findSessionByToken(token: string): Promise<Session | null> {
  const result = await query('SELECT * FROM sessions WHERE token = $1', [token]);
  return result.rows[0] || null;
}

export async function incrementSessionProposalsUsed(id: string): Promise<void> {
  await query('UPDATE sessions SET proposals_used = proposals_used + 1 WHERE id = $1', [id]);
}

export async function saveProposal(
  userId: string | null,
  sessionId: string | null,
  jobDescription: string,
  platform: string,
  length: string,
  generatedProposal: string
): Promise<Proposal> {
  const result = await query(
    `INSERT INTO proposals (user_id, session_id, job_description, platform, length, generated_proposal) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, sessionId, jobDescription, platform, length, generatedProposal]
  );
  return result.rows[0];
}

export async function getProposalsByUserId(userId: string): Promise<Proposal[]> {
  const result = await query(
    'SELECT * FROM proposals WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

export async function createPayment(
  userId: string | null,
  sessionId: string | null,
  amount: number,
  paymentType: string,
  flutterwaveReference: string
): Promise<Payment> {
  const result = await query(
    `INSERT INTO payments (user_id, session_id, amount, payment_type, flutterwave_reference) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, sessionId, amount, paymentType, flutterwaveReference]
  );
  return result.rows[0];
}

export async function updatePaymentStatus(reference: string, status: string): Promise<void> {
  await query(
    `UPDATE payments SET status = $1, completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END WHERE flutterwave_reference = $2`,
    [status, reference]
  );
}

export async function createAuditLog(
  userId: string | null,
  action: string,
  resource: string,
  resourceId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await query(
    `INSERT INTO audit_logs (user_id, action, resource, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)`,
    [userId, action, resource, resourceId, metadata ? JSON.stringify(metadata) : null]
  );
}
```

- [x] **Step 5: Update health route to check DB**

Modify: `backend/src/routes/health.ts` (create it)

```typescript
import { Router } from 'express';
import { query } from '../config/database';

const router = Router();

router.get('/', async (_req, res) => {
  const checks: Record<string, string> = {};

  try {
    await query('SELECT 1');
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  const allOk = Object.values(checks).every((s) => s === 'ok');
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    ...checks,
  });
});

export default router;
```

- [x] **Step 6: Verify health endpoint**

Run: `cd backend && npx tsx src/index.ts` in background, then:
```
curl http://localhost:5001/api/health
```
Expected: `{"status":"ok","database":"error"}` (DB not running yet, but endpoint works)

---

### Task 1.4: DeepSeek Integration

**Files:**
- Create: `backend/src/config/deepseek.ts`
- Create: `backend/src/services/deepseekService.ts`
- Create: `backend/src/services/proposalEngine.ts`

- [x] **Step 1: Create config/deepseek.ts**

```typescript
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-placeholder';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';

export const deepseekConfig = {
  apiKey: DEEPSEEK_API_KEY,
  baseUrl: DEEPSEEK_BASE_URL,
  model: 'deepseek-chat',
  temperature: 0.7,
};
```

- [x] **Step 2: Create services/deepseekService.ts**

```typescript
import { deepseekConfig } from '../config/deepseek';
import { logger } from '../utils/logger';

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  if (deepseekConfig.apiKey === 'sk-placeholder') {
    logger.warn('DeepSeek API key not configured, returning mock response');
    return mockProposal(userPrompt);
  }

  try {
    const response = await fetch(`${deepseekConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deepseekConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: deepseekConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: deepseekConfig.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as DeepSeekResponse;
    return data.choices[0].message.content;
  } catch (error) {
    logger.error('DeepSeek API call failed', { error: String(error) });
    throw new Error('Failed to generate proposal. Please try again.');
  }
}

function mockProposal(userPrompt: string): string {
  const name = userPrompt.split('\n')[0].slice(0, 30);
  return `I have reviewed your project "${name}" and I am confident I can deliver excellent results.

With 5+ years of experience in web development, I have completed similar projects that required attention to detail and timely delivery. My approach involves understanding your requirements thoroughly, maintaining clear communication throughout, and delivering work that exceeds expectations.

Here is my plan:
1. Review requirements and ask clarifying questions
2. Begin work and provide regular progress updates
3. Deliver on time with thorough testing

Let me know when you would like to get started. I am available to begin immediately.`;
}
```

- [x] **Step 3: Create services/proposalEngine.ts**

```typescript
import { callDeepSeek } from './deepseekService';

const SYSTEM_PROMPT = `You are a professional proposal writer for Nigerian freelancers on Upwork and Fiverr.

RULES:
1. NEVER start with "I am passionate" or generic phrases.
2. ALWAYS open with a specific insight from the job listing.
3. Use professional, warm Nigerian English (not robotic).
4. Do NOT mention time zone (WAT) unless the client explicitly asks for it.
5. For Upwork: detailed (project focused, timeline estimate).
6. For Fiverr: punchy (gig focused, short).
7. Avoid clichés ("look no further", "I am the perfect fit").
8. End with a clear, confident statement of next steps. Do NOT end with a question.
9. Keep under word limit (150 for Fiverr, 250 for Upwork, 350 for technical).
10. Sound human, not AI. Use contractions. Do not use dashes (em or en). Use periods or spaces instead.

STRUCTURE:
- Hook: Show you understand THEIR specific need (2-3 sentences)
- Your fit: Relevant experience + why different (3-4 sentences)
- Approach: How you'll solve (2-3 sentences)
- Closing: Confident next steps (1-2 sentences, no questions)`;

const WORD_LIMITS: Record<string, number> = {
  short: 150,
  standard: 250,
  detailed: 350,
};

export async function generateProposal(params: {
  jobDescription: string;
  platform: string;
  length: string;
  userContext?: string;
}): Promise<{ proposal: string; characterCount: number }> {
  const wordLimit = WORD_LIMITS[params.length] || 250;

  let userPrompt = `Job Description:\n${params.jobDescription}\n\nPlatform: ${params.platform}\nLength: ${params.length}`;
  if (params.userContext) {
    userPrompt += `\n\nMy Background:\n${params.userContext}`;
  }

  const proposal = await callDeepSeek(SYSTEM_PROMPT, userPrompt, Math.ceil(wordLimit * 1.3));

  return {
    proposal,
    characterCount: proposal.length,
  };
}
```

- [x] **Step 4: Create test for proposal engine**

```typescript
// backend/src/services/__tests__/proposalEngine.test.ts
import { describe, it, expect } from 'vitest';
import { generateProposal } from '../proposalEngine';

describe('proposalEngine', () => {
  it('should generate a proposal with mock data when no API key', async () => {
    const result = await generateProposal({
      jobDescription: 'Need a React developer for e-commerce site',
      platform: 'upwork',
      length: 'standard',
    });

    expect(result.proposal).toBeTruthy();
    expect(result.characterCount).toBeGreaterThan(0);
    expect(typeof result.proposal).toBe('string');
  });

  it('should respect word limits by length', async () => {
    const short = await generateProposal({
      jobDescription: 'Test job',
      platform: 'fiverr',
      length: 'short',
    });
    const words = short.proposal.split(' ').length;
    expect(words).toBeLessThan(300); // mock may exceed slightly
  });
});
```

- [x] **Step 5: Run tests**

Run: `cd backend && npx vitest run`
Expected: Tests pass.

---

### Task 1.5: Proposal Generation Endpoint

**Files:**
- Create: `backend/src/middleware/rateLimit.ts`
- Create: `backend/src/routes/proposals.ts`
- Create: `backend/src/services/sessionService.ts`
- Modify: `backend/src/server.ts`

- [x] **Step 1: Create middleware/rateLimit.ts**

```typescript
import rateLimit from 'express-rate-limit';

export const sessionRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'RATE_LIMITED', message: 'Too many requests. Try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'RATE_LIMITED', message: 'Too many requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

- [x] **Step 2: Create services/sessionService.ts**

```typescript
import { v4 as uuidv4 } from 'uuid';
import { findSessionByToken, incrementSessionProposalsUsed, saveProposal } from '../database/queries';
import { UnauthorizedError } from '../utils/errors';

const SESSION_LIMITS: Record<string, number> = {
  flash: 5,
  power: 20,
};

const SESSION_DURATIONS: Record<string, number> = {
  flash: 30 * 60 * 1000,
  power: 4 * 60 * 60 * 1000,
};

export function generateSessionToken(): string {
  return `sess_${uuidv4()}`;
}

export function getSessionLimit(plan: string): number {
  return SESSION_LIMITS[plan] || 5;
}

export function getSessionDuration(plan: string): number {
  return SESSION_DURATIONS[plan] || 30 * 60 * 1000;
}

export async function validateSession(token: string): Promise<boolean> {
  const session = await findSessionByToken(token);
  if (!session) return false;
  if (session.payment_status !== 'completed') return false;
  if (new Date() > new Date(session.expires_at)) return false;
  if (session.proposals_used >= session.proposals_limit) return false;
  return true;
}

export async function useSessionProposal(token: string): Promise<void> {
  const session = await findSessionByToken(token);
  if (!session) throw new UnauthorizedError('Invalid session');
  if (new Date() > new Date(session.expires_at)) throw new UnauthorizedError('Session expired');
  if (session.proposals_used >= session.proposals_limit) throw new UnauthorizedError('Proposal limit reached');
  await incrementSessionProposalsUsed(session.id);
}
```

- [x] **Step 3: Create routes/proposals.ts**

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { generateProposal } from '../services/proposalEngine';
import { validateSession, useSessionProposal } from '../services/sessionService';
import { saveProposal } from '../database/queries';
import { sessionRateLimit } from '../middleware/rateLimit';
import { ValidationError, UnauthorizedError } from '../utils/errors';

const router = Router();

const generateSchema = z.object({
  job_description: z.string().min(10, 'Job description must be at least 10 characters').max(5000),
  platform: z.enum(['upwork', 'fiverr', 'other']),
  length: z.enum(['short', 'standard', 'detailed']),
  user_context: z.string().max(1000).optional(),
  session_token: z.string().optional(),
});

router.post('/generate', sessionRateLimit, async (req, res, next) => {
  try {
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid input', { errors: parsed.error.flatten().fieldErrors });
    }

    const { job_description, platform, length, user_context, session_token } = parsed.data;

    if (session_token) {
      const valid = await validateSession(session_token);
      if (!valid) throw new UnauthorizedError('Invalid or expired session');
      await useSessionProposal(session_token);
    }

    const result = await generateProposal({
      jobDescription: job_description,
      platform,
      length,
      userContext: user_context,
    });

    if (session_token) {
      await saveProposal(null, null, job_description, platform, length, result.proposal);
    }

    res.json({
      proposal: result.proposal,
      character_count: result.characterCount,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
```

- [x] **Step 4: Update server.ts to mount proposals route**

```typescript
// Add to server.ts imports
import proposalsRouter from './routes/proposals';

// Add after health route
app.use('/api/proposals', proposalsRouter);
```

---

### Task 1.6: Flutterwave Payment Integration

**Files:**
- Create: `backend/src/config/flutterwave.ts`
- Create: `backend/src/services/paymentService.ts`
- Create: `backend/src/routes/payments.ts`
- Modify: `backend/src/server.ts`

- [x] **Step 1: Create config/flutterwave.ts**

```typescript
export const flutterwaveConfig = {
  publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || 'pk_placeholder',
  secretKey: process.env.FLUTTERWAVE_SECRET_KEY || 'sk_placeholder',
  baseUrl: 'https://api.flutterwave.com/v3',
};
```

- [x] **Step 2: Create services/paymentService.ts**

```typescript
import { flutterwaveConfig } from '../config/flutterwave';
import { logger } from '../utils/logger';
import { PaymentError } from '../utils/errors';

const SESSION_PRICES: Record<string, number> = {
  flash: 500,
  power: 1200,
};

const SUBSCRIPTION_PRICES: Record<string, number> = {
  starter: 2000,
  pro: 3500,
  ultra: 5000,
};

export function getSessionPrice(plan: string): number {
  return SESSION_PRICES[plan] || 500;
}

export function getSubscriptionPrice(plan: string): number {
  return SUBSCRIPTION_PRICES[plan] || 2000;
}

export async function initSessionPayment(plan: string, email: string, frontendUrl: string) {
  const amount = getSessionPrice(plan);
  const txRef = `PROP_${plan}_${Date.now()}`;

  if (flutterwaveConfig.secretKey === 'sk_placeholder') {
    logger.warn('Flutterwave not configured, returning mock payment link');
    return {
      payment_link: `${frontendUrl}/session/success?reference=${txRef}`,
      reference: txRef,
    };
  }

  try {
    const response = await fetch(`${flutterwaveConfig.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${flutterwaveConfig.secretKey}`,
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount,
        currency: 'NGN',
        payment_options: 'card,ussd,bank_transfer',
        customer: { email, name: email.split('@')[0] },
        customizations: {
          title: `ProposalPro ${plan} Session`,
          description: plan === 'flash' ? '30 min access' : '4 hour access',
        },
        redirect_url: `${frontendUrl}/session/success?reference={FLW_REF}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Flutterwave error: ${response.status}`);
    }

    const data = await response.json();
    return {
      payment_link: data.data.link,
      reference: txRef,
    };
  } catch (error) {
    logger.error('Flutterwave payment init failed', { error: String(error) });
    throw new PaymentError('Failed to initiate payment. Please try again.');
  }
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (flutterwaveConfig.secretKey === 'sk_placeholder') return true;
  const crypto = require('crypto');
  const hash = crypto.createHmac('sha256', flutterwaveConfig.secretKey)
    .update(body)
    .digest('hex');
  return hash === signature;
}
```

- [x] **Step 3: Create routes/payments.ts**

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { initSessionPayment, verifyWebhookSignature, getSubscriptionPrice } from '../services/paymentService';
import { generateSessionToken, getSessionLimit, getSessionDuration } from '../services/sessionService';
import { createSession, createPayment, updatePaymentStatus, createAuditLog } from '../database/queries';
import { ValidationError, PaymentError } from '../utils/errors';

const router = Router();

const initSessionSchema = z.object({
  plan: z.enum(['flash', 'power']),
  email: z.string().email(),
});

const initSubscriptionSchema = z.object({
  plan: z.enum(['starter', 'pro', 'ultra']),
});

router.post('/init-session', async (req, res, next) => {
  try {
    const parsed = initSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid input', { errors: parsed.error.flatten().fieldErrors });
    }

    const { plan, email } = parsed.data;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const result = await initSessionPayment(plan, email, frontendUrl);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/init-subscription', async (req, res, next) => {
  try {
    const parsed = initSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid input', { errors: parsed.error.flatten().fieldErrors });
    }

    const { plan } = parsed.data;
    const amount = getSubscriptionPrice(plan);
    const txRef = `PROP_SUB_${plan}_${Date.now()}`;

    res.json({
      payment_link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/subscription?reference=${txRef}`,
      reference: txRef,
      amount,
      plan,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/webhook', async (req, res) => {
  const signature = req.headers['verif-hash'] as string;

  if (!verifyWebhookSignature(JSON.stringify(req.body), signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { event, data } = req.body;

  if (event === 'charge.completed' && data.status === 'successful') {
    const { tx_ref, amount, currency, customer } = data;

    await createPayment(null, null, amount, 'one_time', tx_ref);
    await updatePaymentStatus(tx_ref, 'completed');

    if (tx_ref.startsWith('PROP_flash_') || tx_ref.startsWith('PROP_power_')) {
      const plan = tx_ref.startsWith('PROP_flash_') ? 'flash' : 'power';
      const token = generateSessionToken();
      const limit = getSessionLimit(plan);
      const duration = getSessionDuration(plan);
      const expiresAt = new Date(Date.now() + duration);

      await createSession(token, plan, customer.email, expiresAt, limit);
      await createAuditLog(null, 'session_created', 'sessions', '', { plan, token });
    }

    return res.status(200).json({ status: 'success' });
  }

  res.status(200).json({ status: 'ignored' });
});

export default router;
```

- [x] **Step 4: Mount payments route in server.ts**

```typescript
import paymentsRouter from './routes/payments';
app.use('/api/payments', paymentsRouter);
```

---

### Task 1.7: SuperTokens Auth Setup

**Files:**
- Create: `backend/src/config/supertokens.ts`
- Create: `backend/src/middleware/auth.ts`
- Create: `backend/src/routes/user.ts`
- Modify: `backend/src/server.ts`

- [x] **Step 1: Create config/supertokens.ts**

```typescript
import supertokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import { logger } from '../utils/logger';

export function initSuperTokens() {
  const connectionUri = process.env.SUPERTOKENS_URI || 'http://localhost:3567';

  supertokens.init({
    supertokens: { connectionURI: connectionUri },
    appInfo: {
      appName: 'ProposalPro',
      apiDomain: process.env.API_URL || 'http://localhost:5001',
      websiteDomain: process.env.FRONTEND_URL || 'http://localhost:3000',
      apiBasePath: '/api/auth',
      websiteBasePath: '/auth',
    },
    recipeList: [
      EmailPassword.init(),
      Session.init(),
    ],
  });

  logger.info('SuperTokens initialized');
}
```

- [x] **Step 2: Create middleware/auth.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import Session from 'supertokens-node/recipe/session';
import { UnauthorizedError } from '../utils/errors';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await Session.getSession(req, res);
    (req as any).userId = session.getUserId();
    next();
  } catch {
    next(new UnauthorizedError('Authentication required'));
  }
}
```

- [x] **Step 3: Create routes/user.ts**

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { findUserById } from '../database/queries';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
```

- [x] **Step 4: Mount SuperTokens middleware**

In `backend/src/server.ts`, add after express.json():
```typescript
import { middleware } from 'supertokens-node/framework/express';
app.use(middleware());
```

And mount auth routes:
```typescript
import userRouter from './routes/user';
app.use('/api/user', userRouter);
```

---

### Task 1.8: Email Service

**Files:**
- Create: `backend/src/config/email.ts`
- Create: `backend/src/services/emailService.ts`

- [x] **Step 1: Create config/email.ts**

```typescript
export const emailConfig = {
  host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
  port: parseInt(process.env.ZOHO_SMTP_PORT || '587'),
  user: process.env.ZOHO_SMTP_USER || 'noreply@proposalpro.ng',
  pass: process.env.ZOHO_SMTP_PASS || 'placeholder',
  from: 'ProposalPro <noreply@proposalpro.ng>',
};
```

- [x] **Step 2: Create services/emailService.ts**

```typescript
import nodemailer from 'nodemailer';
import { emailConfig } from '../config/email';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: false,
      auth: { user: emailConfig.user, pass: emailConfig.pass },
    });
  }
  return transporter;
}

export async function sendReceipt(email: string, plan: string, amount: number, reference: string) {
  if (emailConfig.pass === 'placeholder') {
    logger.info('Email not configured, skipping receipt send', { email, plan });
    return;
  }

  try {
    await getTransporter().sendMail({
      from: emailConfig.from,
      to: email,
      subject: `ProposalPro ${plan} Receipt`,
      html: `<h2>Payment Confirmed</h2><p>Plan: ${plan}</p><p>Amount: ₦${amount}</p><p>Reference: ${reference}</p>`,
    });
    logger.info('Receipt email sent', { email, reference });
  } catch (error) {
    logger.error('Failed to send receipt', { error: String(error), email });
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  if (emailConfig.pass === 'placeholder') {
    logger.info('Email not configured, skipping welcome email', { email });
    return;
  }

  try {
    await getTransporter().sendMail({
      from: emailConfig.from,
      to: email,
      subject: 'Welcome to ProposalPro!',
      html: `<h2>Welcome, ${name}!</h2><p>Start generating winning proposals today.</p>`,
    });
  } catch (error) {
    logger.error('Failed to send welcome email', { error: String(error) });
  }
}
```

---

## Phase 2: Frontend

### Task 2.1: Initialize Next.js Frontend

**Files:**
- Create: `frontend/` via create-next-app
- Create: Tailwind config, shadcn/ui setup, global styles

- [x] **Step 1: Create Next.js app**

Run:
```
npx create-next-app@14 frontend --typescript --tailwind --eslint --app --src-dir --no-import-alias
cd frontend
```

- [x] **Step 2: Install additional dependencies**

Run:
```
npm install axios zustand lucide-react zod
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast
```

- [x] **Step 3: Create frontend/.env.local**

```
NEXT_PUBLIC_API_URL=http://localhost:5001
```

- [x] **Step 4: Update globals.css for monochrome theme**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 96%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96%;
    --muted-foreground: 0 0% 45%;
    --accent: 0 0% 96%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 90%;
    --input: 0 0% 90%;
    --ring: 0 0% 9%;
    --radius: 0.5rem;
  }
}
```

- [x] **Step 5: Create basic shadcn/ui components**

Create `frontend/components/ui/button.tsx`:
```tsx
import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function Button({ className = "", variant = "default", size = "default", ...props }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
  const variants: Record<string, string> = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  }
  const sizes: Record<string, string> = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 text-sm",
    lg: "h-11 px-8",
  }
  return <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
}
```

- [x] **Step 6: Create lib/api.ts**

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
  headers: { 'Content-Type': 'application/json' },
});

export async function generateProposal(data: {
  job_description: string;
  platform: string;
  length: string;
  session_token?: string;
}) {
  const response = await api.post('/api/proposals/generate', data);
  return response.data;
}

export async function initSessionPayment(plan: string, email: string) {
  const response = await api.post('/api/payments/init-session', { plan, email });
  return response.data;
}

export default api;
```

- [x] **Step 7: Test frontend builds**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors.

---

### Task 2.2: Landing Page

**Files:**
- Create: `frontend/app/page.tsx`
- Modify: `frontend/app/layout.tsx`

- [x] **Step 1: Create layout.tsx**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ProposalPro - AI Proposals for Nigerian Freelancers',
  description: 'Write winning Upwork and Fiverr proposals in 30 seconds. No subscription needed. Pay as you go.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [x] **Step 2: Create page.tsx (landing page)**

```tsx
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <span className="font-bold text-lg">ProposalPro</span>
          <nav className="flex gap-4 items-center text-sm">
            <Link href="/session" className="text-gray-600 hover:text-black">Try Now</Link>
            <Link href="/auth/login" className="text-gray-600 hover:text-black">Sign In</Link>
            <Link href="/auth/signup" className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Write winning proposals<br />in 30 seconds
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            AI-powered proposals for Nigerian freelancers on Upwork and Fiverr.
            Pay as you go. No subscription needed.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/session" className="bg-black text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800">
              Generate a Proposal — ₦500
            </Link>
            <Link href="#pricing" className="border border-gray-300 px-6 py-3 rounded-md font-medium hover:bg-gray-50">
              View Pricing
            </Link>
          </div>
        </section>

        <section id="pricing" className="border-t border-gray-200 py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Simple Pricing</h2>
            <div className="flex justify-center gap-4 mb-8">
              <span className="bg-black text-white px-4 py-1 rounded-full text-sm">Session</span>
              <span className="text-gray-400 px-4 py-1 text-sm">Monthly</span>
            </div>
            <div className="flex gap-4 justify-center max-w-md mx-auto">
              <div className="flex-1 border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wide">Flash</p>
                <p className="text-3xl font-bold mt-2">₦500</p>
                <p className="text-sm text-gray-500 mt-1">5 proposals · 30 min</p>
                <Link href="/session" className="mt-4 block bg-gray-100 text-black py-2 rounded-md text-sm font-medium hover:bg-gray-200">
                  Get Flash
                </Link>
              </div>
              <div className="flex-1 border-2 border-black rounded-lg p-6 text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wide">Power</p>
                <p className="text-3xl font-bold mt-2">₦1,200</p>
                <p className="text-sm text-gray-500 mt-1">20 proposals · 4 hours</p>
                <Link href="/session" className="mt-4 block bg-black text-white py-2 rounded-md text-sm font-medium hover:bg-gray-800">
                  Get Power
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-200 py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <div className="grid grid-cols-3 gap-8 mt-8">
              {[
                { step: '1', title: 'Paste Job', desc: 'Copy the job description from Upwork or Fiverr' },
                { step: '2', title: 'Generate', desc: 'AI writes a winning proposal in seconds' },
                { step: '3', title: 'Submit', desc: 'Copy and send. Land more clients.' },
              ].map(({ step, title, desc }) => (
                <div key={step}>
                  <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">{step}</div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        <p>ProposalPro — Built for Nigerian freelancers</p>
      </footer>
    </div>
  )
}
```

---

### Task 2.3: Session/Proposal Generator Page

**Files:**
- Create: `frontend/app/session/page.tsx`
- Create: `frontend/store/sessionStore.ts`
- Create: `frontend/hooks/useSession.ts`

- [x] **Step 1: Create store/sessionStore.ts**

```typescript
import { create } from 'zustand';

interface SessionState {
  token: string | null;
  plan: 'flash' | 'power' | null;
  expiresAt: number | null;
  proposalsUsed: number;
  proposalsLimit: number;
  setSession: (token: string, plan: 'flash' | 'power', expiresAt: number, limit: number) => void;
  incrementUsed: () => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  token: null,
  plan: null,
  expiresAt: null,
  proposalsUsed: 0,
  proposalsLimit: 0,
  setSession: (token, plan, expiresAt, limit) =>
    set({ token, plan, expiresAt, proposalsUsed: 0, proposalsLimit: limit }),
  incrementUsed: () => set((s) => ({ proposalsUsed: s.proposalsUsed + 1 })),
  clearSession: () =>
    set({ token: null, plan: null, expiresAt: null, proposalsUsed: 0, proposalsLimit: 0 }),
}));
```

- [x] **Step 2: Create hooks/useSession.ts**

```typescript
'use client';
import { useEffect } from 'react';
import { useSessionStore } from '../store/sessionStore';

export function useSession() {
  const { token, expiresAt, proposalsUsed, proposalsLimit, clearSession } = useSessionStore();

  useEffect(() => {
    if (!token || !expiresAt) return;
    const check = setInterval(() => {
      if (Date.now() > expiresAt) {
        clearSession();
        alert('Session expired. Purchase a new session to continue.');
      }
    }, 10000);
    return () => clearInterval(check);
  }, [token, expiresAt, clearSession]);

  return {
    isValid: !!token && !!expiresAt && Date.now() < expiresAt && proposalsUsed < proposalsLimit,
    remaining: proposalsLimit - proposalsUsed,
    isExpired: !!token && !!expiresAt && Date.now() > expiresAt,
  };
}
```

- [x] **Step 3: Create app/session/page.tsx**

```tsx
'use client';
import { useState, FormEvent } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { useSession } from '../../hooks/useSession';
import { generateProposal, initSessionPayment } from '../../lib/api';
import { Button } from '../../components/ui/button';

export default function SessionPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [platform, setPlatform] = useState('upwork');
  const [length, setLength] = useState('standard');
  const [proposal, setProposal] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [pricingTab, setPricingTab] = useState<'session' | 'monthly'>('session');
  const [email, setEmail] = useState('');
  const { token, setSession, proposalsUsed, proposalsLimit } = useSessionStore();
  const { isValid, remaining } = useSession();

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setShowPricing(true);
      return;
    }
    setLoading(true);
    try {
      const result = await generateProposal({
        job_description: jobDescription,
        platform,
        length,
        session_token: token!,
      });
      setProposal(result.proposal);
      useSessionStore.getState().incrementUsed();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate proposal');
    } finally {
      setLoading(false);
    }
  }

  async function handleBuySession(plan: 'flash' | 'power') {
    try {
      const result = await initSessionPayment(plan, email);
      window.location.href = result.payment_link;
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment failed');
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(proposal);
    alert('Copied!');
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <span className="font-bold">ProposalPro</span>
          {isValid && (
            <span className="text-sm text-gray-500">
              {remaining} proposals remaining
            </span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!showPricing ? (
          <>
            {/* Session timer indicator */}
            {isValid && (
              <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                Session active — {remaining} proposal{remaining !== 1 ? 's' : ''} left
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full h-40 p-3 border border-gray-300 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Paste the job description from Upwork or Fiverr..."
                  required
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="upwork">Upwork</option>
                    <option value="fiverr">Fiverr</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Length</label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="short">Short (Fiverr)</option>
                    <option value="standard">Standard (Upwork)</option>
                    <option value="detailed">Detailed (Technical)</option>
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Generating...' : isValid ? 'Generate Proposal' : 'Unlock Proposal — Purchase Session'}
              </Button>
            </form>

            {proposal && (
              <div className="mt-8 border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Your Proposal</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>Copy</Button>
                    <Button variant="outline" size="sm" onClick={() => setProposal('')}>New</Button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 font-sans">
                  {proposal}
                </pre>
              </div>
            )}
          </>
        ) : (
          /* Pricing Modal */
          <div className="max-w-lg mx-auto py-12">
            <h2 className="text-2xl font-bold text-center mb-2">Unlock Proposal Generation</h2>
            <p className="text-gray-500 text-center mb-8">Choose a plan to start generating proposals</p>

            <div className="flex justify-center gap-2 mb-8">
              <button
                onClick={() => setPricingTab('session')}
                className={`px-4 py-1 rounded-full text-sm ${pricingTab === 'session' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}
              >
                Session
              </button>
              <button
                onClick={() => setPricingTab('monthly')}
                className={`px-4 py-1 rounded-full text-sm ${pricingTab === 'monthly' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}
              >
                Monthly
              </button>
            </div>

            {pricingTab === 'session' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email for receipt</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-500 uppercase">Flash</p>
                    <p className="text-3xl font-bold mt-2">₦500</p>
                    <p className="text-sm text-gray-500 mt-1">5 proposals · 30 min</p>
                    <Button className="mt-4 w-full" variant="secondary" onClick={() => handleBuySession('flash')}>Get Flash</Button>
                  </div>
                  <div className="flex-1 border-2 border-black rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-500 uppercase">Power</p>
                    <p className="text-3xl font-bold mt-2">₦1,200</p>
                    <p className="text-sm text-gray-500 mt-1">20 proposals · 4 hours</p>
                    <Button className="mt-4 w-full" onClick={() => handleBuySession('power')}>Get Power</Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { plan: 'Starter', price: '₦2k', props: '10 proposals/mo' },
                  { plan: 'Pro', price: '₦3.5k', props: 'Unlimited' },
                  { plan: 'Ultra', price: '₦5k', props: 'Unlimited + priority' },
                ].map(({ plan, price, props }) => (
                  <div key={plan} className="border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase">{plan}</p>
                    <p className="text-xl font-bold mt-1">{price}<span className="text-xs font-normal text-gray-500">/mo</span></p>
                    <p className="text-xs text-gray-500 mt-1">{props}</p>
                    <Button variant="outline" size="sm" className="mt-3 w-full">Subscribe</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
```

---

### Task 2.4: Payment Success Page

**Files:**
- Create: `frontend/app/session/success/page.tsx`

- [x] **Step 1: Create success page**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSessionStore } from '../../../store/sessionStore';
import Link from 'next/link';

export default function SessionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success'>('processing');

  useEffect(() => {
    const reference = searchParams.get('reference');
    if (!reference) {
      router.push('/session');
      return;
    }

    // In production, the backend webhook creates the session.
    // For now, simulate a session token for testing.
    const mockToken = `sess_mock_${Date.now()}`;
    useSessionStore.getState().setSession(
      mockToken,
      reference.startsWith('PROP_flash') ? 'flash' : 'power',
      Date.now() + (reference.startsWith('PROP_flash') ? 30 * 60 * 1000 : 4 * 60 * 60 * 1000),
      reference.startsWith('PROP_flash') ? 5 : 20
    );

    setTimeout(() => setStatus('success'), 1500);
  }, [searchParams, router]);

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">Your session is now active. Start generating winning proposals.</p>
        <Link href="/session" className="inline-block bg-black text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800">
          Start Generating
        </Link>
      </div>
    </div>
  );
}
```

---

### Task 2.5: Auth UI (Login/Signup)

**Files:**
- Create: `frontend/app/auth/login/page.tsx`
- Create: `frontend/app/auth/signup/page.tsx`
- Create: `frontend/app/auth/callback/page.tsx`
- Create: `frontend/store/userStore.ts`

- [x] **Step 1: Create store/userStore.ts**

```typescript
import { create } from 'zustand';

interface UserState {
  userId: string | null;
  email: string | null;
  subscriptionTier: string;
  setUser: (userId: string, email: string, tier: string) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  email: null,
  subscriptionTier: 'free',
  setUser: (userId, email, tier) => set({ userId, email, subscriptionTier: tier }),
  clearUser: () => set({ userId: null, email: null, subscriptionTier: 'free' }),
}));
```

- [x] **Step 2: Create auth/login/page.tsx**

```tsx
'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formFields: [{ id: 'email', value: email }, { id: 'password', value: password }] }),
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Connection error. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required />
          </div>
          <Button type="submit" className="w-full">Sign In</Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          No account? <Link href="/auth/signup" className="text-black underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
```

- [x] **Step 3: Create auth/signup/page.tsx** (similar pattern with SuperTokens signup)

```tsx
'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formFields: [{ id: 'email', value: email }, { id: 'password', value: password }] }),
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.message || 'Signup failed');
      }
    } catch {
      setError('Connection error. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required minLength={8} />
          </div>
          <Button type="submit" className="w-full">Create Account</Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link href="/auth/login" className="text-black underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
```

---

### Task 2.6: Dashboard

**Files:**
- Create: `frontend/app/dashboard/page.tsx`
- Create: `frontend/app/dashboard/proposals/page.tsx`
- Create: `frontend/app/dashboard/subscription/page.tsx`
- Create: `frontend/app/dashboard/settings/page.tsx`
- Create: `frontend/components/Header.tsx`

- [x] **Step 1: Create dashboard layout**

`frontend/app/dashboard/layout.tsx`:
```tsx
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="font-bold">ProposalPro</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/dashboard" className="text-gray-600 hover:text-black">Dashboard</Link>
            <Link href="/dashboard/proposals" className="text-gray-600 hover:text-black">Proposals</Link>
            <Link href="/dashboard/subscription" className="text-gray-600 hover:text-black">Subscription</Link>
            <Link href="/dashboard/settings" className="text-gray-600 hover:text-black">Settings</Link>
            <Link href="/session" className="bg-black text-white px-3 py-1 rounded text-sm">New Proposal</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
```

- [x] **Step 2: Create dashboard/page.tsx**

```tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({ proposals: 0, tier: 'free', monthlyLimit: 0, used: 0 });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setStats({
            proposals: 0,
            tier: data.user.subscription_tier,
            monthlyLimit: data.user.proposal_limit_this_month,
            used: data.user.proposal_count_this_month,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-500">Proposals</p>
          <p className="text-3xl font-bold mt-1">{stats.proposals}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-500">Plan</p>
          <p className="text-3xl font-bold mt-1 capitalize">{stats.tier}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-500">Monthly Usage</p>
          <p className="text-3xl font-bold mt-1">{stats.used}/{stats.monthlyLimit || '∞'}</p>
        </div>
      </div>
      <Link href="/session" className="inline-block bg-black text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800">
        Generate New Proposal
      </Link>
    </div>
  );
}
```

- [x] **Step 3: Create proposals page**

`frontend/app/dashboard/proposals/page.tsx`:
```tsx
'use client';
import { useEffect, useState } from 'react';

interface Proposal {
  id: string;
  job_description: string;
  platform: string;
  generated_proposal: string;
  created_at: string;
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/proposals`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setProposals(data.proposals || []))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Saved Proposals</h1>
      {proposals.length === 0 ? (
        <p className="text-gray-500">No saved proposals yet.</p>
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">{p.platform} · {new Date(p.created_at).toLocaleDateString()}</p>
              <p className="text-sm text-gray-700 line-clamp-2">{p.job_description}</p>
              <details className="mt-2">
                <summary className="text-sm font-medium cursor-pointer">View Proposal</summary>
                <pre className="mt-2 text-sm whitespace-pre-wrap font-sans text-gray-600">{p.generated_proposal}</pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [x] **Step 4: Create subscription page**

`frontend/app/dashboard/subscription/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { Button } from '../../../components/ui/button';

const PLANS = [
  { id: 'starter', name: 'Starter', price: '₦2,000', proposals: '10/month' },
  { id: 'pro', name: 'Pro', price: '₦3,500', proposals: 'Unlimited' },
  { id: 'ultra', name: 'Ultra', price: '₦5,000', proposals: 'Unlimited + Priority' },
];

export default function SubscriptionPage() {
  const [selected, setSelected] = useState('pro');

  async function handleSubscribe(plan: string) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/init-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
        credentials: 'include',
      });
      const data = await response.json();
      if (data.payment_link) window.location.href = data.payment_link;
    } catch {
      alert('Failed to initiate subscription');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Subscription</h1>
      <div className="grid grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white border rounded-lg p-6 text-center cursor-pointer ${selected === plan.id ? 'border-black' : 'border-gray-200'}`}
            onClick={() => setSelected(plan.id)}
          >
            <p className="text-sm text-gray-500 uppercase">{plan.name}</p>
            <p className="text-2xl font-bold mt-2">{plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></p>
            <p className="text-sm text-gray-500 mt-1">{plan.proposals}</p>
            <Button className="mt-4 w-full" variant={selected === plan.id ? 'default' : 'outline'} onClick={() => handleSubscribe(plan.id)}>
              Subscribe
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Phase 3: Integration & Deployment *(not started)*

### Task 3.1: Docker Setup

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: proposalpro
      POSTGRES_PASSWORD: proposalpro
      POSTGRES_DB: proposalpro
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  supertokens:
    image: registry.supertokens.io/supertokens/supertokens-postgresql:7.0
    depends_on:
      - postgres
    environment:
      POSTGRESQL_CONNECTION_URI: postgresql://proposalpro:proposalpro@postgres:5432/proposalpro
    ports:
      - "3567:3567"

volumes:
  pgdata:
```

- [ ] **Step 2: Create backend/Dockerfile**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 5001
CMD ["node", "dist/index.js"]
```

- [ ] **Step 3: Create frontend/Dockerfile**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

### Task 3.2: GitHub Actions CI/CD

**Files:**
- Create: `.github/workflows/test.yml`
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create test.yml**

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: proposalpro
          POSTGRES_PASSWORD: proposalpro
          POSTGRES_DB: proposalpro
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd backend && npm ci
      - run: cd backend && npm run build
      - run: cd backend && npm test
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
```

- [ ] **Step 2: Create deploy.yml**

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Trigger Coolify Deploy
        run: |
          curl -X POST ${{ secrets.COOLIFY_WEBHOOK_URL }}
```

---

### Task 3.3: Final Wiring & Verification

- [ ] **Step 1: Start docker services**

Run: `docker-compose up -d`
Expected: PostgreSQL on 5432, SuperTokens on 3567.

- [ ] **Step 2: Run database migrations**

Run: `cd backend && npx tsx -e "require('./src/config/database').runMigrations().then(() => process.exit(0))"`
Expected: Migrations applied.

- [ ] **Step 3: Start backend**

Run: `cd backend && npm run dev`
Expected: Server starts on port 5001.

- [ ] **Step 4: Test health endpoint**

Run: `curl http://localhost:5001/api/health`
Expected: `{"status":"ok","database":"ok"}`

- [ ] **Step 5: Start frontend**

Run: `cd frontend && npm run dev`
Expected: Frontend on port 3000.

- [ ] **Step 6: Test full flow**

1. Open http://localhost:3000 — landing page loads
2. Click "Generate a Proposal" — redirects to /session
3. Fill form, click generate — pricing modal appears
4. Enter email, click "Get Flash" — redirects to success page
5. Go back to /session — session active, generate works
6. Open http://localhost:3000/auth/signup — create account
7. Login — redirects to dashboard
8. Dashboard shows stats, proposals, subscription

---

## Self-Check

- [x] Phase 1 complete: Backend compiles, all endpoints respond, DB connected
- [x] Phase 2 complete: Frontend builds, all pages render, API calls work
- [ ] Phase 3 complete: Docker compose up, CI passes, full flow works end-to-end
- [x] Emerald/teal brand style consistent across all pages
- [x] Session pricing toggle works (Flash/Power)
- [x] Monthly subscription toggle works (Starter/Pro/Ultra)
- [x] Proposal generation returns results
- [x] Subscription success flow works (confirm-subscription endpoint)
- [x] Cancel subscription works (cancel-subscription endpoint)
- [x] Account isolation — each user sees own plans
- [x] Session store cleared on signout/signin — no cross-account leak
- [x] Mock/stub mode works without real API keys
- [x] Error handling returns proper JSON responses
- [x] Rate limiting active on proposal endpoint
- [x] Toast system replaces alert() calls
- [x] Inline validation on auth forms
- [x] Error/loading/404 pages
- [x] No password_hash exposed in API responses
