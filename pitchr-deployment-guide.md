# Pitchr — Deployment Guide

## Overview

A single Docker Compose file launches everything at once:

```
postgres  →  supertokens  →  backend  →  frontend
                                        →  caddy (SSL reverse proxy)
```

One command to start: `docker compose up -d`

---

## 1. Prerequisites

| Item | Where | Cost |
|------|-------|------|
| **VPS** | [Hetzner Cloud](https://hetzner.cloud) → CX23 (2 vCPU, 4 GB) | €9/mo |
| **Domain** | Any registrar (e.g. Whogohost, Namecheap) | ~₦2,000/yr |
| **GitHub** | Already set up — `ogungbadeshalom/pitchr-mvp` | Free |
| **DeepSeek key** | [platform.deepseek.com](https://platform.deepseek.com) | ~$1/mo |
| **Flutterwave keys** | [dashboard.flutterwave.com](https://dashboard.flutterwave.com) | 1.4% + ₦20/tx |
| **ZeptoMail key** | [zeptomail.com](https://zeptomail.com) | Free (5K/mo) |

---

## 2. VPS Setup (10 minutes)

### 2.1 Rent the VPS

1. Go to [Hetzner Cloud Console](https://console.hetzner.cloud)
2. Create a new project
3. **Add server**:

| Setting | Value |
|---------|-------|
| Location | Nuremberg (lowest latency to Nigeria) |
| Image | Ubuntu 24.04 LTS |
| Type | CX23 (2 vCPU, 4 GB RAM, €9/mo) |
| SSH key | Add your public key (see below) |
| Firewall | Create one allowing: 22 (SSH), 80 (HTTP), 443 (HTTPS) |

**Generate an SSH key if you don't have one:**
```bash
# On your local machine (Windows PowerShell or Git Bash):
ssh-keygen -t ed25519 -C "your-email@example.com"
# Copy the public key:
cat ~/.ssh/id_ed25519.pub
# Paste this into Hetzner's SSH key section
```

### 2.2 Connect to Your VPS

```bash
ssh root@<your-vps-ip-address>
```

You'll get the IP from Hetzner after the server starts.

### 2.3 Install Docker + Docker Compose

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify
docker --version
docker compose version
# If the above fails on older Docker, use: docker-compose --version
```

---

## 3. Set Up DNS (Domain)

In your domain registrar's DNS settings, create these **A records** pointing to your VPS IP:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `your-vps-ip` |
| A | `api` | `your-vps-ip` |
| A | `www` | `your-vps-ip` |

DNS changes can take **5 minutes to 24 hours** to propagate. Continue while you wait.

---

## 4. Deploy Pitchr (5 minutes)

### 4.1 Clone the Repo on Your VPS

```bash
cd /root
git clone https://github.com/ogungbadeshalom/pitchr-mvp.git pitchr
cd pitchr
```

### 4.2 Create the .env File

```bash
cp .env.production.example .env
nano .env
```

Fill in every value:

| Variable | What to Put |
|----------|-------------|
| `POSTGRES_PASSWORD` | A strong password (e.g. generate one: `openssl rand -hex 16`) |
| `JWT_SECRET` | Run `openssl rand -hex 32` and paste the output |
| `DEEPSEEK_API_KEY` | Your key from [platform.deepseek.com](https://platform.deepseek.com) |
| `FLUTTERWAVE_PUBLIC_KEY` | Your live public key from Flutterwave dashboard |
| `FLUTTERWAVE_SECRET_KEY` | Your live secret key from Flutterwave dashboard |
| `SUPERTOKENS_API_KEY` | Generate with `openssl rand -hex 32`, same as docker-compose.yml |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console (or keep `placeholder` to disable) |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console (or keep `placeholder`) |
| `ZEPTOMAIL_API_KEY` | Your key from ZeptoMail dashboard (or keep `placeholder`) |
| `FRONTEND_URL` | `https://pitchr.com.ng` (your actual domain) |
| `API_URL` | `https://api.pitchr.com.ng` |

### 4.3 Update the Domain in Caddyfile

```bash
nano Caddyfile
```

Replace `pitchr.com.ng` with **your actual domain** (e.g. `yourname.ng`). Also update `FRONTEND_URL` and `API_URL` in `.env` to match.

### 4.4 Launch Everything

```bash
docker compose up -d
```

This single command:
1. Pulls PostgreSQL 15 and SuperTokens images
2. Builds the backend from `./backend/Dockerfile` (TypeScript → JavaScript)
3. Builds the frontend from `./frontend/Dockerfile` (Next.js standalone output — Node.js server)
4. Runs database migrations automatically on backend startup
5. Starts Caddy with auto SSL via Let's Encrypt
6. Connects everything on one Docker network

**First build takes 2–5 minutes.** Subsequent runs are instant (cached).

### 4.5 Check Everything Is Running

```bash
# See all containers
docker compose ps

# Watch the logs
docker compose logs -f --tail=50
```

You should see all 5 containers showing `Up` or `healthy`:
- `pitchr-postgres` — PostgreSQL (healthy)
- `pitchr-supertokens` — SuperTokens auth
- `pitchr-backend` — Express API
- `pitchr-frontend` — Next.js
- `pitchr-caddy` — Reverse proxy

---

## 5. Flutterwave Webhook

For payment notifications to work:

1. Go to [Flutterwave Dashboard](https://dashboard.flutterwave.com) → **Settings** → **Webhooks**
2. Add webhook URL: `https://api.yourdomain.com.ng/api/payments/webhook`

The webhook handler:
- Activates session payments (creates session token with expiry)
- Activates subscription payments (updates user tier)
- Sends receipt emails via ZeptoMail

---

## 6. Google OAuth (Optional)

Only do this if you set real Google credentials in `.env`.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → **APIs & Services** → **Credentials**
3. Create **OAuth 2.0 Client ID** (Web application)
4. Add these **Authorized redirect URIs**:
   - `https://pitchr.com.ng/api/auth/callback/google` (SuperTokens backend callback)
   - `https://pitchr.com.ng/auth/callback` (frontend redirect page)
5. Copy Client ID and Client Secret into your `.env` on the VPS
6. Restart: `docker compose restart backend supertokens`

---

## 7. Updating After Code Changes

```bash
# SSH into your VPS
cd /root/pitchr

# Pull latest code
git pull

# Rebuild and restart only changed services
docker compose up -d --build

# Or rebuild everything from scratch
docker compose up -d --build --force-recreate
```

---

## 8. Useful Commands

```bash
# View logs for a specific service
docker compose logs -f --tail=100 backend
docker compose logs -f --tail=100 frontend

# Restart a single service
docker compose restart backend

# Stop everything
docker compose down

# Stop everything AND delete database (⚠️ loses all data)
docker compose down -v

# Check resource usage
docker stats
```

---

## 9. Post-Deploy Checklist

- [ ] `https://api.pitchr.com.ng/api/health` returns 200
- [ ] `https://pitchr.com.ng` loads landing page
- [ ] Sign up with email works
- [ ] Sign in with email works
- [ ] Flash session purchase (₦500) → redirected to `/session/success`
- [ ] Proposal generation works
- [ ] Dark mode toggle works
- [ ] SSL certificate is valid (green lock in browser)

---

## 10. Now What? (Post-Launch Steps)

### 10.1 Verify Health

```bash
# From your VPS
curl http://localhost:5001/api/health
```

Expected output:
```json
{"status":"ok","timestamp":"2026-06-17T...","database":"connected"}
```

If you see `database: "connected"`, everything is wired up correctly.

### 10.2 Set Up Flutterwave Webhook

In Flutterwave Dashboard → Settings → Webhooks, add:
```
https://api.yourdomain.com.ng/api/payments/webhook
```

This lets Pitchr handle payment confirmations automatically (session activation, subscription activation, email receipts).

### 10.3 Test the Full Flow

- Open `https://your-domain` in a browser (Caddy requires a domain name for SSL)
- Sign up with email
- Buy a Flash Session (₦500) — test payment with Flutterwave test card
- Generate a proposal — paste any job description
- Verify the proposal saves to your dashboard
- Test dark mode toggle
- Test on mobile

### 10.4 Updating After Code Changes

```bash
ssh root@your-vps-ip
cd /root/pitchr
git pull
docker compose up -d --build
```

### 10.5 Monitoring

```bash
# Check logs for errors
docker compose logs -f --tail=50

# Check disk space
df -h

# Check memory usage
free -m

# Set up automatic security updates
apt install unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades
```

---

## 11. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `auth_failed` on backend | Wrong DB password in `.env` | Check `POSTGRES_PASSWORD` in `.env` |
| Backend can't connect to postgres | Postgres not ready yet | Wait 30s for health check, or `docker compose logs postgres` |
| SSL not working | DNS not propagated yet | Wait, or test with `http://` temporarily |
| `tsc: not found` during build | Build context wrong | You're running from repo root, not backend folder |
| Port 80/443 already in use | Another web server running | `apt remove nginx apache2` if installed |
| Frontend shows blank page | Missing `NEXT_PUBLIC_API_URL` | Check `.env` has `API_URL` set |
| Can't SSH into VPS | Firewall blocking 22 | Check Hetzner firewall settings |

---

## 12. Monthly Cost

| Item | Cost |
|------|------|
| Hetzner CX23 VPS | €9 (~₦5,400) |
| Domain | ~₦170/mo |
| DeepSeek API | ~$1 (~₦600) |
| Flutterwave fees | 1.4% + ₦20 per tx |
| ZeptoMail | Free |
| **Total** | **~₦6,170/mo** |

At 100 session sales/month (₦50K+), infra cost is ~12% of revenue.
