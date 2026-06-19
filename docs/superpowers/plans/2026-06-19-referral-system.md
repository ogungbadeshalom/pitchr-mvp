# Referral System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a track-only referral system — marketers get unique links, 10% lifetime commission on referred user payments.

**Architecture:** URL parameter `?ref=CODE` sets a 30-day cookie. Signup reads cookie and stamps `referred_by` on user. Completed payments query user's `referred_by` and record commission. Admin dashboard shows per-marketer stats.

**Tech Stack:** PostgreSQL (new table + column migration), Express routes (admin-only), Next.js 14 App Router (admin page), Zustand (in-memory only, no new store needed)

---

### Task 1: Database Migration

**Files:**
- Create: `backend/src/database/migrations/006_referrals.sql`
- No existing files modified

- [ ] **Step 1: Create migration file**

```sql
CREATE TABLE IF NOT EXISTS referral_links (
  code TEXT PRIMARY KEY,
  marketer_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT REFERENCES referral_links(code);
```

- [ ] **Step 2: Verify migration runs**

`npx tsx -e "require('dotenv/config'); const { runMigrations } = require('./src/config/database'); runMigrations().then(() => console.log('OK'))"`

- [ ] **Step 3: Commit**

```bash
git add backend/src/database/migrations/006_referrals.sql
git commit -m "feat: add referral_links table and users.referred_by column"
```

---

### Task 2: Database Queries

**Files:**
- Modify: `backend/src/database/queries.ts` — add referral queries at end

- [ ] **Step 1: Add referral query functions**

```typescript
export async function createReferralLink(code: string, marketerName: string): Promise<void> {
  await query('INSERT INTO referral_links (code, marketer_name) VALUES ($1, $2)', [code.toLowerCase(), marketerName]);
}

export async function deleteReferralLink(code: string): Promise<void> {
  await query('DELETE FROM referral_links WHERE code = $1', [code.toLowerCase()]);
}

export interface ReferralLinkRow {
  code: string;
  marketer_name: string;
  signups: number;
  total_revenue: number;
  commission_owed: number;
}

export async function listReferralLinks(): Promise<ReferralLinkRow[]> {
  const result = await query(`
    SELECT
      rl.code,
      rl.marketer_name,
      COUNT(u.id)::int AS signups,
      COALESCE(SUM(p.amount), 0)::int AS total_revenue,
      COALESCE(SUM(p.amount) * 0.1, 0)::int AS commission_owed
    FROM referral_links rl
    LEFT JOIN users u ON u.referred_by = rl.code
    LEFT JOIN payments p ON p.user_id = u.id AND p.status = 'completed'
    GROUP BY rl.code, rl.marketer_name
    ORDER BY rl.created_at DESC
  `);
  return result.rows;
}

export async function findUserReferredBy(userId: string): Promise<string | null> {
  const result = await query('SELECT referred_by FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.referred_by || null;
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/database/queries.ts
git commit -m "feat: add referral link CRUD and stats queries"
```

---

### Task 3: Admin Referral Routes

**Files:**
- Modify: `backend/src/routes/admin.ts` — add 3 referral endpoints

- [ ] **Step 1: Add referral routes to admin.ts**

At end of file, before `export default router`:

```typescript
router.get('/referral-links', requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const links = await listReferralLinks();
    res.json({ links });
  } catch (err) {
    next(err);
  }
});

router.post('/referral-links', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, marketer_name } = req.body;
    if (!code || typeof code !== 'string' || code.trim() === '') {
      throw new AppError('Referral code is required', 'VALIDATION_ERROR', 400);
    }
    if (!marketer_name || typeof marketer_name !== 'string' || marketer_name.trim() === '') {
      throw new AppError('Marketer name is required', 'VALIDATION_ERROR', 400);
    }
    await createReferralLink(code.trim().toLowerCase(), marketer_name.trim());
    const links = await listReferralLinks();
    res.status(201).json({ links });
  } catch (err) {
    next(err);
  }
});

router.delete('/referral-links/:code', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    await deleteReferralLink(code.toLowerCase());
    res.json({ message: 'Referral link removed' });
  } catch (err) {
    next(err);
  }
});
```

- [ ] **Step 2: Add imports at top of admin.ts**

```typescript
import { listReferralLinks, createReferralLink, deleteReferralLink } from '../database/queries';
```

- [ ] **Step 3: Typecheck and run tests**

```bash
cd backend && npx tsc --noEmit && npm test
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/admin.ts
git commit -m "feat: add admin referral-link CRUD endpoints"
```

---

### Task 4: Landing Page — Referral Cookie

**Files:**
- Modify: `frontend/src/app/page.tsx` — read `?ref=` param, set cookie via layout or page
- Create: a simple mechanism to set the cookie on page load

- [ ] **Step 1: In the landing page server component, pass ref param to client component**

No server change needed — the `LandingPage` client component already handles the page.

- [ ] **Step 2: Add cookie logic to landing-page.tsx**

In `frontend/src/components/landing-page.tsx`, add a `useEffect` that reads `?ref=` and sets cookie:

```typescript
import { useSearchParams } from 'next/navigation';

// Inside the LandingPage component:
const searchParams = useSearchParams();

useEffect(() => {
  const ref = searchParams.get('ref');
  if (ref && ref.trim()) {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `pitchr_ref=${ref.trim().toLowerCase()}; expires=${expires}; path=/; SameSite=Lax`;
  }
}, [searchParams]);
```

- [ ] **Step 3: Wrap in Suspense boundary if not already**

Since `useSearchParams` requires Suspense, ensure the landing page is wrapped. If not, move the cookie logic to a separate `<ReferralTracker />` component wrapped in Suspense in the parent layout.

- [ ] **Step 4: Build and verify**

```bash
cd frontend && npx next build
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/landing-page.tsx
git commit -m "feat: set pitchr_ref cookie from ?ref= URL parameter on landing page"
```

---

### Task 5: Signup Capture — Email

**Files:**
- Modify: `backend/src/routes/auth.ts` — read `pitchr_ref` cookie on signup

- [ ] **Step 1: Capture referral in signup route**

In the signup handler, after creating the user but before responding, add:

```typescript
const refCode = req.cookies?.pitchr_ref;
if (refCode && typeof refCode === 'string') {
  const existing = (await query('SELECT code FROM referral_links WHERE code = $1', [refCode.toLowerCase()])).rows[0];
  if (existing) {
    await query('UPDATE users SET referred_by = $1 WHERE id = $2', [existing.code, user.id]);
  }
}
```

- [ ] **Step 2: Do the same in the Google-finish route**

In `google-finish`, after `upsertUser` returns, add the same referral capture:

```typescript
const refCode = req.cookies?.pitchr_ref;
if (refCode && typeof refCode === 'string') {
  const existing = (await query('SELECT code FROM referral_links WHERE code = $1', [refCode.toLowerCase()])).rows[0];
  if (existing) {
    await query('UPDATE users SET referred_by = $1 WHERE id = $2', [existing.code, user.id]);
  }
}
```

- [ ] **Step 3: Typecheck and run tests**

```bash
cd backend && npx tsc --noEmit && npm test
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/auth.ts
git commit -m "feat: capture pitchr_ref cookie on signup and google-finish"
```

---

### Task 6: Frontend — Admin Referrals Page

**Files:**
- Create: `frontend/src/app/admin/referrals/page.tsx`
- Modify: `frontend/src/app/admin/layout.tsx` — add Referrals nav item

- [ ] **Step 1: Create referrals page**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useToastStore } from '../../../store/toastStore';

interface ReferralLink {
  code: string;
  marketer_name: string;
  signups: number;
  total_revenue: number;
  commission_owed: number;
}

export default function ReferralsPage() {
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  function load() {
    fetch('/api/admin/referral-links', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setLinks(data.links || []))
      .catch(() => addToast('Failed to load referral links', 'error'));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/referral-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), marketer_name: name.trim() }),
        credentials: 'include',
      });
      if (res.ok) {
        setCode('');
        setName('');
        load();
        addToast('Referral link created', 'success');
      } else {
        addToast('Failed to create', 'error');
      }
    } catch {
      addToast('Connection error', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(linkCode: string) {
    try {
      const res = await fetch(`/api/admin/referral-links/${linkCode}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        load();
        addToast('Referral link removed', 'success');
      } else {
        addToast('Failed to remove', 'error');
      }
    } catch {
      addToast('Connection error', 'error');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Referrals</h1>
          <p className="text-sm text-muted-foreground mt-1">Track marketer commissions and referral performance</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-5 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Referral Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. james"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white dark:bg-card"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Marketer Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. James Okonkwo"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white dark:bg-card"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={creating}
            className="w-full sm:w-auto bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Link'}
          </button>
        </div>
      </form>

      <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-100 dark:border-brand-800 bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Marketer</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Signups</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Revenue</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Commission (10%)</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {links.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  No referral links yet. Create one above.
                </td>
              </tr>
            ) : (
              links.map((l) => (
                <tr key={l.code} className="border-b border-brand-50 dark:border-brand-800/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{l.marketer_name}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-muted px-2 py-1 rounded">{l.code}</code>
                  </td>
                  <td className="px-4 py-3 text-right">{l.signups}</td>
                  <td className="px-4 py-3 text-right">₦{l.total_revenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-600">₦{l.commission_owed.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(l.code)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add Referrals to admin sidebar**

In `frontend/src/app/admin/layout.tsx`, add to the navigation array:

```tsx
{ href: '/admin/referrals', label: 'Referrals' },
```

- [ ] **Step 3: Build and verify**

```bash
cd frontend && npx next build
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/admin/referrals/page.tsx frontend/src/app/admin/layout.tsx
git commit -m "feat: add admin referrals page with create/delete/stats"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Full backend typecheck + tests**

```bash
cd backend && npx tsc --noEmit && npm test
```

- [ ] **Step 2: Full frontend build**

```bash
cd frontend && npx next build
```

- [ ] **Step 3: Deploy**

```bash
git push origin main
```

---

### Summary

| Task | What | Files |
|------|------|-------|
| 1 | Migration | `006_referrals.sql` |
| 2 | Queries | `queries.ts` |
| 3 | Admin routes | `admin.ts` |
| 4 | Landing cookie | `landing-page.tsx` |
| 5 | Signup capture | `auth.ts` |
| 6 | Admin UI | `referrals/page.tsx`, `admin/layout.tsx` |
| 7 | Verify + Deploy | — |
