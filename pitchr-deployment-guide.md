# Pitchr — Deployment Guide

## Overview

Pitchr runs as two independent services:

| Service | Stack | Port |
|---------|-------|------|
| **Backend** | Express + TypeScript | 5001 |
| **Frontend** | Next.js 14 (App Router) | 3000 |

Both need PostgreSQL 15 + SuperTokens as dependencies.

Deployment target: **Coolify** on a VPS (Hetzner CX23 recommended).

---

## 1. Prerequisites

- **Domain** — e.g. `pitchr.ng` and `api.pitchr.ng` (subdomain for backend API)
- **VPS** — Hetzner CX23 (2 vCPU, 4 GB RAM, €9/mo) or similar
- **GitHub account** — your repo is already at `https://github.com/ogungbadeshalom/pitchr-mvp`
- **API keys** (see section 4)

---

## 2. VPS Setup

### 2.1 Rent a VPS

Go to [Hetzner](https://hetzner.cloud) → Create project → Add server:

| Setting | Value |
|---------|-------|
| Location | Nuremberg (closest to Nigeria) |
| Image | Ubuntu 24.04 |
| Type | CX23 (2 vCPU, 4 GB RAM) |
| SSH Key | Add your public key |
| Firewall | Allow 22, 80, 443, 3000, 5001 (or use Coolify proxy for 80/443) |

### 2.2 Initial Setup

```bash
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Coolify (one-liner)
curl -fsSL https://get.coolify.io/install.sh | bash
```

After installation, Coolify dashboard is at `http://your-vps-ip:8000` (or `https://your-vps-ip:7443` for the SSL version).

### 2.3 Configure Coolify

1. Open `http://your-vps-ip:8000` in your browser
2. Create an admin account (email + password)
3. Go to **Servers** → **Add server** → select `localhost` (it should auto-detect)

---

## 3. Domain & SSL

### 3.1 DNS Records

In your domain registrar (e.g. Whogohost, Netlify, Namecheap), create these **A records** pointing to your VPS IP:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `your-vps-ip` |
| A | `api` | `your-vps-ip` |
| A | `www` | `your-vps-ip` |

### 3.2 Proxy in Coolify

1. Go to **Proxy** tab in Coolify
2. Enable **Dynamic Proxy** (uses Caddy under the hood, auto-provisions SSL via Let's Encrypt)
3. Make sure ports 80 and 443 are open in your VPS firewall

---

## 4. Environment Variables

### 4.1 Required API Keys

| Service | Where to Get | Purpose |
|---------|-------------|---------|
| **DeepSeek** | [platform.deepseek.com](https://platform.deepseek.com) | AI proposal generation |
| **Flutterwave** | [dashboard.flutterwave.com](https://dashboard.flutterwave.com) | Payment processing (card, USSD, transfer) |
| **ZeptoMail** | [zeptomail.com](https://zeptomail.com) | Transactional emails (receipts, welcome) |
| **Google OAuth** | [console.cloud.google.com](https://console.cloud.google.com) | Optional — social login |

> **Mock mode:** All services fall back to mock mode when their API key is set to `placeholder`. Great for testing before you have real keys.

### 4.2 Full Env Reference

#### Backend (`backend/.env`)

```
NODE_ENV=production
JWT_SECRET=<generate a random 64-char string>
PORT=5001
DATABASE_URL=postgresql://pitchr:<db-password>@postgres:5432/pitchr
DEEPSEEK_API_KEY=<your-deepseek-key>
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
FLUTTERWAVE_PUBLIC_KEY=<your-flutterwave-pk>
FLUTTERWAVE_SECRET_KEY=<your-flutterwave-sk>
SUPERTOKENS_URI=http://supertokens:3567
SUPERTOKENS_API_KEY=placeholder
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
ZEPTOMAIL_API_KEY=<your-zeptomail-key>
ZEPTOMAIL_FROM=noreply@pitchr.ng
FRONTEND_URL=https://pitchr.ng
API_URL=https://api.pitchr.ng
LOG_LEVEL=info
```

**Generate a JWT secret:**
```bash
openssl rand -hex 32
# → c9a8b7... (64 hex chars) — paste this as JWT_SECRET
```

#### Frontend

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.pitchr.ng` |

---

## 5. Deploying PostgreSQL & SuperTokens

These are infrastructure dependencies and should run as standalone containers (or a Coolify Compose stack).

### Docker Compose (for Coolify)

Create a new **Docker Compose** resource in Coolify with this content:

```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: pitchr
      POSTGRES_PASSWORD: <choose-a-strong-password>
      POSTGRES_DB: pitchr
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pitchr"]
      interval: 10s
      timeout: 5s
      retries: 5

  supertokens:
    image: registry.supertokens.io/supertokens/supertokens-postgresql:7.0
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      POSTGRESQL_CONNECTION_URI: postgresql://pitchr:<db-password>@postgres:5432/pitchr
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3567/hello"]
      interval: 15s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

Replace `<db-password>` with the same password from `POSTGRES_PASSWORD`.

> **Note:** SuperTokens is only needed if you want Google OAuth. If you skip it, set `GOOGLE_CLIENT_ID=placeholder` in backend env to disable it, and remove the SuperTokens service.

---

## 6. Deploying the Backend

### 6.1 In Coolify

1. **Resources** → **New resource** → **Private Repository** (or **Public Repository**)
2. Connect your GitHub repo (`ogungbadeshalom/pitchr-mvp`)
3. Set:
   - **Build pack**: `Dockerfile`
   - **Base directory**: `/backend`
   - **Port**: `5001`
   - **Domains**: `api.pitchr.ng`

### 6.2 Environment Variables

Add every variable from section 4.2 to the Coolify resource. **Crucial:**

- `DATABASE_URL` must point to the PostgreSQL container by its Coolify internal hostname (e.g. `postgres` if it's the service name from the compose resource above)
- If Postgres is deployed in the same Coolify project, you can use the Coolify internal DNS: `postgres://pitchr:password@postgres:5432/pitchr`

### 6.3 Health Check

After deployment, verify: `https://api.pitchr.ng/api/health`

Expected response:
```json
{ "status": "ok", "timestamp": "2026-06-16T...", "database": "connected" }
```

---

## 7. Deploying the Frontend

### 7.1 In Coolify

1. **Resources** → **New resource** → **Private Repository**
2. Connect the same GitHub repo
3. Set:
   - **Build pack**: `Dockerfile`
   - **Base directory**: `/frontend`
   - **Port**: `3000`
   - **Domains**: `pitchr.ng`

### 7.2 Environment Variables

Add just one:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.pitchr.ng` |

### 7.3 Verification

- Open `https://pitchr.ng` — landing page should load
- Click **Try It Now** — should scroll to pricing
- Sign up / Sign in should work
- Session and subscription pricing should show correct ₦ amounts

---

## 8. Google OAuth (Optional)

Skip this section if you set `GOOGLE_CLIENT_ID=placeholder`.

### 8.1 Google Cloud Console Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → **APIs & Services** → **Credentials**
3. Create **OAuth 2.0 Client ID** (Web application)
4. Add these **Authorized redirect URIs**:
   - `https://api.pitchr.ng/auth/callback/google` (production SuperTokens callback)
   - `http://localhost:3567/auth/callback/google` (dev)
5. Copy Client ID and Client Secret into backend env vars

### 8.2 Verify

- On the login page, click **Continue with Google**
- You should be redirected to Google, then back to a pitchr.ng session

---

## 9. Flutterwave Webhook

For payment notifications to work, configure Flutterwave to send webhooks to your backend.

1. Go to [Flutterwave Dashboard](https://dashboard.flutterwave.com) → **Settings** → **Webhooks**
2. Add webhook URL: `https://api.pitchr.ng/api/payments/webhook`
3. Copy the **Secret Hash** → set as `FLUTTERWAVE_SECRET_HASH` in backend env (if needed for signature verification)

The webhook handler:
- Processes `charge.completed` events
- Activates session payments (creates session token with expiry)
- Activates subscription payments (updates user tier with 30/365-day expiry)
- Sends receipt emails via ZeptoMail

---

## 10. Auto-Deploy (GitHub → Coolify)

The repo already has `.github/workflows/deploy.yml` — it triggers a webhook on push to `main`.

### Setup

1. In Coolify, go to your project → **Webhooks**
2. Copy the deployment webhook URL
3. In GitHub repo → **Settings** → **Secrets and variables** → **Actions**
4. Add secret: `COOLIFY_WEBHOOK_URL` = the Coolify webhook URL

Now every push to `main` will auto-deploy both services.

---

## 11. Post-Deploy Checklist

- [ ] `https://api.pitchr.ng/api/health` returns 200
- [ ] `https://pitchr.ng` loads landing page
- [ ] Sign up with email works
- [ ] Sign in with email works
- [ ] Flash session purchase (₦500) → redirected to `/session/success`
- [ ] Power session purchase (₦1,200) → redirected to `/session/success`
- [ ] Proposal generation works (paste job → get proposal)
- [ ] Subscription purchase confirms correctly
- [ ] Dashboard shows proposal count and usage
- [ ] Dark mode toggle works
- [ ] Session persists across tab close/reopen (until expiry)
- [ ] Email receipts arrive (if ZeptoMail configured)
- [ ] Google OAuth works (if configured)

---

## 12. Troubleshooting

### Backend won't start

Check Coolify logs. Common issues:

| Symptom | Cause | Fix |
|---------|-------|-----|
| `ECONNREFUSED postgres:5432` | Backend started before Postgres | Add health check dependency or restart backend |
| `column billing_period already exists` | Migration re-run | Already fixed — migration uses `ADD COLUMN IF NOT EXISTS` |
| `JWT_SECRET is not set in production` | Missing env var | Set `JWT_SECRET` in Coolify backend env |
| `cannot connect to SuperTokens` | SuperTokens not running | Check SuperTokens container logs, ensure DB connection string is correct |

### Frontend build fails

```bash
# If OOM during build on low-memory VPS:
# Increase swap or build locally and deploy the .next/ output
```

Or switch Coolify build to the Dockerfile (which handles multi-stage builds).

### Payments not working

- Ensure `FLUTTERWAVE_SECRET_KEY` is set to a **live** key (not `sk_placeholder` or test key)
- Verify Flutterwave webhook URL is accessible from the internet
- Check backend logs for payment errors

### CORS errors in browser

- Verify `FRONTEND_URL` in backend env matches your frontend domain exactly (including `https://`)
- The backend's CORS middleware uses this value as the allowed origin

---

## 13. Monthly Cost Breakdown

| Item | Cost | Notes |
|------|------|-------|
| Hetzner CX23 VPS | €9/mo (~₦5,400) | Hosts everything |
| Domain | ~₦2,000/yr (~₦170/mo) | .ng domain |
| DeepSeek API | ~$1/mo (~₦600) | 500 proposals |
| Flutterwave fees | 1.4% + ₦20 per tx | Per transaction |
| ZeptoMail | Free tier | 5K emails/mo |
| **Total base** | **~₦6,170/mo** | Before Flutterwave fees |

At 100 session sales/month, revenue is ~₦50K+. Infrastructure cost is ~12% of revenue.

---

## 14. Production Security Checklist

- [ ] `JWT_SECRET` is a long random string (set in production, never the dev default)
- [ ] `NODE_ENV=production` (disables debug error details)
- [ ] PostgreSQL password is strong and unique
- [ ] VPS firewall restricts SSH to your IP only
- [ ] Docker containers run as non-root where possible
- [ ] Flutterwave webhook uses signature verification (already implemented)
- [ ] HTTPS is enabled (Coolify/Caddy handles this automatically)
- [ ] Regular PostgreSQL backups configured (Coolify can automate this)

---

## 15. Scaling Notes

At current architecture, the CX23 can handle:
- **~500 concurrent users** on the Next.js frontend
- **~50 concurrent proposal generations** (30s each, sequential per connection)
- **PostgreSQL** handles thousands of rows in proposals/payments tables without issues

If you hit limits:
1. **Database** — upgrade to CX33 or separate DB to a managed Postgres service
2. **Backend** — add horizontal scaling behind a load balancer (requires sticky sessions or shared JWT secret)
3. **Proposal generation** — queue generation jobs with a worker process (Bull + Redis)
