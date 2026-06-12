# PWA Installability

Users on mobile can install Pitchr as a standalone app from their browser without opening Google.

## Scope

**Basic installability only** — no offline caching, no push notifications, no background sync.

## What Gets Built

### 1. App Icons

Resize the existing `public/images/logo.jpg` (810×723) into two PNG icons:

| Size | Path |
|---|---|
| 192×192 | `public/icons/icon-192x192.png` |
| 512×512 | `public/icons/icon-512x512.png` |

Generated once via a build script.

### 2. Web App Manifest

`public/manifest.json` with:

| Field | Value |
|---|---|
| `name` | Pitchr |
| `short_name` | Pitchr |
| `description` | AI proposals for Nigerian freelancers |
| `start_url` | `/` |
| `display` | `standalone` |
| `background_color` | `#ffffff` |
| `theme_color` | `#059669` (brand emerald 500) |
| `icons` | Both PNGs with `"purpose": "any maskable"` |

### 3. Service Worker

`public/sw.js` — minimal required to satisfy the installability criteria:

- `self.addEventListener('install')` — skip waiting
- `self.addEventListener('activate')` — claim clients
- No fetch handler (no caching)

### 4. PWA Setup Component

`src/components/pwa-setup.tsx` — client component that:

- Registers the service worker on mount
- Listens for `beforeinstallprompt` event
- Captures the event and shows an "Install App" button
- Persists user dismissals

### 5. Layout Integration

- `src/app/layout.tsx`: Add `manifest: '/manifest.json'` and `themeColor: '#059669'` to metadata
- Render `<PwaSetup />` inside `<body>`

### 6. next.config.mjs

No changes needed — static files in `public/` are served automatically.

## Files Changed

| File | Action |
|---|---|
| `public/icons/icon-192x192.png` | New (generated) |
| `public/icons/icon-512x512.png` | New (generated) |
| `public/manifest.json` | New |
| `public/sw.js` | New |
| `src/components/pwa-setup.tsx` | New |
| `src/app/layout.tsx` | Edit (metadata + component) |

## No Dependencies

No npm packages added. Everything uses browser APIs and static files.
