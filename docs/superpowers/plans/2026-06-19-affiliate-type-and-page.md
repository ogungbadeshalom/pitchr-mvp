# Affiliate Type & Public Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add referral type (affiliate 5% / marketer 10%), admin type assignment, and a public affiliate self-serve page.

**Architecture:** New migration adds `type` column. Admin form gets type dropdown. Backend gets public `GET /api/affiliate/:code` route. Frontend gets public `/affiliate` page with code input + stats display.

**Tech Stack:** PostgreSQL migration, Express route, Next.js page

---

### Task 1: Database + Queries Update

**Files:**
- Modify: `backend/src/database/migrations/006_referrals.sql` — add type column
- Modify: `backend/src/database/queries.ts` — update createReferralLink and listReferralLinks

- [ ] **Step 1: Update migration to add type column**

Replace contents of `006_referrals.sql`:
```sql
CREATE TABLE IF NOT EXISTS referral_links (
  code TEXT PRIMARY KEY,
  marketer_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'affiliate',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT REFERENCES referral_links(code);
```

- [ ] **Step 2: Update createReferralLink to accept type**

```typescript
export async function createReferralLink(code: string, marketerName: string, type: string = 'affiliate'): Promise<void> {
  await query('INSERT INTO referral_links (code, marketer_name, type) VALUES ($1, $2, $3)', [code.toLowerCase(), marketerName, type]);
}
```

- [ ] **Step 3: Update listReferralLinks to return type and correct commission**

```typescript
export interface ReferralLinkRow {
  code: string;
  marketer_name: string;
  type: string;
  signups: number;
  total_revenue: number;
  commission_rate: number;
  commission_owed: number;
}

export async function listReferralLinks(): Promise<ReferralLinkRow[]> {
  const result = await query(`
    SELECT
      rl.code,
      rl.marketer_name,
      rl.type,
      COUNT(u.id)::int AS signups,
      COALESCE(SUM(p.amount), 0)::int AS total_revenue,
      CASE WHEN rl.type = 'marketer' THEN 0.10 ELSE 0.05 END AS commission_rate,
      COALESCE(SUM(p.amount) * CASE WHEN rl.type = 'marketer' THEN 0.10 ELSE 0.05 END, 0)::int AS commission_owed
    FROM referral_links rl
    LEFT JOIN users u ON u.referred_by = rl.code
    LEFT JOIN payments p ON p.user_id = u.id AND p.status = 'completed'
    GROUP BY rl.code, rl.marketer_name, rl.type
    ORDER BY rl.created_at DESC
  `);
  return result.rows;
}
```

- [ ] **Step 4: Typecheck and commit**

```bash
cd backend && npx tsc --noEmit
git add backend/src/database/migrations/006_referrals.sql backend/src/database/queries.ts
git commit -m "feat: add referral type column, commission by type (affiliate 5%, marketer 10%)"
```

---

### Task 2: Admin Routes + UI Update

**Files:**
- Modify: `backend/src/routes/admin.ts` — accept type in POST
- Modify: `frontend/src/app/admin/referrals/page.tsx` — type dropdown in form, display in table

- [ ] **Step 1: Update POST route to accept type**

In the `POST /referral-links` route, update validation and create call:
```typescript
const { code, marketer_name, type } = req.body;
// ... existing checks ...
const linkType = type === 'marketer' ? 'marketer' : 'affiliate';
await createReferralLink(code.trim().toLowerCase(), marketer_name.trim(), linkType);
```

- [ ] **Step 2: Update admin referrals page form**

Add a type select between code and name inputs:
```tsx
const [linkType, setLinkType] = useState('affiliate');

// In the form, add:
<div className="w-full sm:w-auto">
  <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
  <select
    value={linkType}
    onChange={(e) => setLinkType(e.target.value)}
    className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white dark:bg-card"
  >
    <option value="affiliate">Affiliate (5%)</option>
    <option value="marketer">Marketer (10%)</option>
  </select>
</div>
```

- [ ] **Step 3: Update table to show type and rate**

Replace `Commission (10%)` header with `Rate` / `Commission` columns, and show per-row rate:
```tsx
<th className="text-right px-4 py-3 font-medium text-muted-foreground">Type</th>
<th className="text-right px-4 py-3 font-medium text-muted-foreground">Rate</th>

// In row:
<td className="px-4 py-3 text-right">
  <span className={`text-xs px-2 py-0.5 rounded-full ${l.type === 'marketer' ? 'bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300' : 'bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300'}`}>
    {l.type === 'marketer' ? 'Marketer' : 'Affiliate'}
  </span>
</td>
<td className="px-4 py-3 text-right">{l.type === 'marketer' ? '10%' : '5%'}</td>
```

- [ ] **Step 4: Update create body to include type**

In handleCreate, add `type: linkType` to the POST body.

- [ ] **Step 5: Build and commit**

```bash
cd frontend && npx next build
git add backend/src/routes/admin.ts frontend/src/app/admin/referrals/page.tsx
git commit -m "feat: add referral type to admin form and table"
```

---

### Task 3: Public Affiliate Page + API

**Files:**
- Create: `frontend/src/app/affiliate/page.tsx`
- Modify: `backend/src/server.ts` — register new router
- Create: `backend/src/routes/affiliate.ts`

- [ ] **Step 1: Create affiliate route file**

`backend/src/routes/affiliate.ts`:
```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { findUserByEmail } from '../database/queries';  // not needed

const router = Router();

router.get('/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const lower = code.toLowerCase();

    const linkResult = await query(
      'SELECT code, marketer_name, type FROM referral_links WHERE code = $1',
      [lower]
    );
    if (linkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Referral code not found' });
    }
    const link = linkResult.rows[0];

    const statsResult = await query(`
      SELECT
        COUNT(u.id)::int AS signups,
        COALESCE(SUM(p.amount), 0)::int AS total_revenue
      FROM referral_links rl
      LEFT JOIN users u ON u.referred_by = rl.code
      LEFT JOIN payments p ON p.user_id = u.id AND p.status = 'completed'
      WHERE rl.code = $1
    `, [lower]);

    const { signups, total_revenue } = statsResult.rows[0];
    const rate = link.type === 'marketer' ? 0.10 : 0.05;
    const commission_owed = Math.floor(total_revenue * rate);

    res.json({
      code: link.code,
      marketer_name: link.marketer_name,
      type: link.type,
      rate: link.type === 'marketer' ? 10 : 5,
      signups,
      total_revenue,
      commission_owed,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
```

- [ ] **Step 2: Register route in server.ts**

In `backend/src/server.ts`, add after other route registrations:
```typescript
import affiliateRouter from './routes/affiliate';
// ...
app.use('/api/affiliate', affiliateRouter);
```

- [ ] **Step 3: Create public affiliate page**

`frontend/src/app/affiliate/page.tsx`:
```tsx
'use client';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AffiliateStats {
  code: string;
  marketer_name: string;
  type: string;
  rate: number;
  signups: number;
  total_revenue: number;
  commission_owed: number;
}

export default function AffiliatePage() {
  const [code, setCode] = useState('');
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setStats(null);
    try {
      const res = await fetch(`/api/affiliate/${code.trim().toLowerCase()}`);
      if (res.ok) {
        setStats(await res.json());
      } else {
        setError('Referral code not found. Check and try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50 dark:from-background dark:via-background dark:to-background px-4">
      <div className="max-w-lg mx-auto py-16">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Image src="/images/P.png" alt="Pitchr logo" width={24} height={24} className="rounded" />
            <span className="text-2xl font-bold text-brand-600 tracking-tight">Pitchr</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Affiliate Earnings</h1>
          <p className="text-sm text-muted-foreground mt-2">Enter your referral code to see your earnings</p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter your referral code"
            className="flex-1 px-4 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white dark:bg-card"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Check'}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400 mb-6">
            {error}
          </div>
        )}

        {stats && (
          <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{stats.marketer_name}</h2>
                <p className="text-sm text-muted-foreground">Code: {stats.code}</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${stats.type === 'marketer' ? 'bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300' : 'bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300'}`}>
                {stats.type === 'marketer' ? 'Marketer' : 'Affiliate'} · {stats.rate}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{stats.signups}</p>
                <p className="text-xs text-muted-foreground mt-1">Signups</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-foreground">₦{stats.total_revenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Revenue</p>
              </div>
              <div className="bg-brand-50 dark:bg-brand-900/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-brand-600">₦{stats.commission_owed.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Commission</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck, build, commit**

```bash
cd backend && npx tsc --noEmit && npm test
cd frontend && npx next build
git add backend/src/routes/affiliate.ts backend/src/server.ts frontend/src/app/affiliate/page.tsx
git commit -m "feat: add public affiliate earnings page and API"
```

---

### Task 4: Final — Merge + Deploy

- [ ] **Step 1: Full verification**

```bash
cd backend && npx tsc --noEmit && npm test
cd frontend && npx next build
```

- [ ] **Step 2: Push to main**

```bash
git checkout main && git pull origin main && git merge feat/updates && git push origin main && git checkout feat/updates
```
