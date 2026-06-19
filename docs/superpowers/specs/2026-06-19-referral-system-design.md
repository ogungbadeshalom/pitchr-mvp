# Referral System Design

## Overview

A track-only referral system for Pitchr. Marketers get unique referral links (`pitchr.com.ng?ref=CODE`). When a prospect clicks the link, a 30-day cookie is set. If they sign up within that window, all their future payments earn the marketer a 10% lifetime commission on gross payment amounts. The system tracks what's owed — payouts happen manually outside the platform.

## Flow

1. Admin creates a referral link in the admin dashboard with a code and marketer name
2. Marketer shares the link (`pitchr.com.ng?ref=james`)
3. Prospect clicks → 30-day cookie (`pitchr_ref=CODE`) set
4. Prospect signs up (email or Google) → user record stamped with `referred_by`
5. Every completed payment by that user → commission calculated (10% of gross)
6. Admin dashboard → Referrals tab shows earned commission per marketer

## Database Changes

### New table: `referral_links`
- `code` TEXT PRIMARY KEY (e.g., "james")
- `marketer_name` TEXT NOT NULL
- `created_at` TIMESTAMPTZ DEFAULT NOW()

### New column on `users`
- `referred_by` TEXT — references `referral_links.code`, NULL if organic

## Backend Changes

### New routes (admin-only)
- `GET /api/admin/referral-links` — list all with stats (signups, revenue, commission)
- `POST /api/admin/referral-links` — create { code, marketer_name }
- `DELETE /api/admin/referral-links/:code` — remove a link

### Modified routes
- `POST /api/auth/signup` — read `pitchr_ref` cookie, set `referred_by` on new user
- `POST /api/auth/google-finish` — read `pitchr_ref` cookie via upsertUser
- `POST /api/payments/webhook` — stamp `referred_by` from user on completed payment
- `POST /api/payments/confirm-subscription` — same

## Frontend Changes

### Landing page
- Read `?ref=` URL param → set `pitchr_ref=CODE` cookie with 30-day expiry
- If `?ref=` is present and valid, show a subtle "Welcome from [marketer]" banner

### Admin sidebar
- Add "Referrals" nav item

### New page: `/admin/referrals`
- Table: marketer name, code, signup count, total revenue, commission owed (10%)
- Create button → modal with code + marketer name inputs
- Delete button per row

## Edge Cases
- Self-referral: if a marketer signs up via their own link, they get flagged? No — don't block it. If they're paying, they earn commission like anyone.
- Expired cookie: if cookie older than 30 days, ignored. Signup is organic.
- Code reuse: the same user clicking multiple referral links → last-click wins. Each click refreshes the cookie.
