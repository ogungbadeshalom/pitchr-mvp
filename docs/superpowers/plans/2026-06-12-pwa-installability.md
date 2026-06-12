# PWA Installability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add basic PWA installability so mobile users can install Pitchr as a standalone app.

**Architecture:** Static files in `public/` (manifest, icons, service worker) + one client component for registration + metadata in layout. Zero npm dependencies.

**Tech Stack:** Browser PWA APIs (`beforeinstallprompt`, `serviceWorker.register`), PowerShell (icon generation), static files.

---

### Task 1: Generate PWA icons from logo.jpg

**Files:**
- Create: `public/icons/icon-192x192.png`
- Create: `public/icons/icon-512x512.png`
- Source: `public/images/logo.jpg`

- [ ] **Step 1: Create icons directory and generate PNGs**

```bash
# Create icons directory if it doesn't exist
mkdir public\icons -Force

# Generate 192x192 icon using PowerShell + .NET
Add-Type -AssemblyName System.Drawing; `
$img = [System.Drawing.Image]::FromFile("$pwd\public\images\logo.jpg"); `
$size192 = [System.Drawing.Bitmap]::new(192, 192); `
$g192 = [System.Drawing.Graphics]::FromImage($size192); `
$g192.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic; `
$g192.DrawImage($img, 0, 0, 192, 192); `
$g192.Dispose(); `
$size192.Save("$pwd\public\icons\icon-192x192.png", [System.Drawing.Imaging.ImageFormat]::Png); `
$size512 = [System.Drawing.Bitmap]::new(512, 512); `
$g512 = [System.Drawing.Graphics]::FromImage($size512); `
$g512.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic; `
$g512.DrawImage($img, 0, 0, 512, 512); `
$g512.Dispose(); `
$size512.Save("$pwd\public\icons\icon-512x512.png", [System.Drawing.Imaging.ImageFormat]::Png); `
$img.Dispose(); `
Write-Host "Icons generated"

# Verify
Get-ChildItem public\icons\
```

Expected: Two files `icon-192x192.png` and `icon-512x512.png` exist in `public/icons/`.

---

### Task 2: Create web app manifest

**Files:**
- Create: `public/manifest.json`

- [ ] **Step 1: Write manifest.json**

```json
{
  "name": "Pitchr",
  "short_name": "Pitchr",
  "description": "AI proposals for Nigerian freelancers",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#059669",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

---

### Task 3: Create minimal service worker

**Files:**
- Create: `public/sw.js`

- [ ] **Step 1: Write sw.js**

```javascript
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
```

No fetch handler — no offline caching, just satisfying the PWA install requirement.

---

### Task 4: Create PwaSetup client component

**Files:**
- Create: `src/components/pwa-setup.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client';
import { useEffect, useState } from 'react';

export default function PwaSetup() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (matchMedia('(display-mode: standalone)').matches) {
      setShowInstall(false);
    }

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setShowInstall(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowInstall(false);
    setDismissed(true);
    // Don't show again for 7 days
    try { localStorage.setItem('pitchr_pwa_dismissed', String(Date.now())); } catch {}
  }

  useEffect(() => {
    if (dismissed) return;
    try {
      const last = localStorage.getItem('pitchr_pwa_dismissed');
      if (last && Date.now() - Number(last) < 7 * 24 * 60 * 60 * 1000) {
        setShowInstall(false);
      }
    } catch {}
  }, [dismissed]);

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[200] bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-4 shadow-lg flex items-center justify-between gap-3 max-w-sm mx-auto">
      <p className="text-sm font-medium text-foreground">Install Pitchr for quick access</p>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Not now
        </button>
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Install
        </button>
      </div>
    </div>
  );
}
```

---

### Task 5: Update layout.tsx

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add manifest and themeColor to metadata, render PwaSetup**

```tsx
import type { Metadata } from 'next'
import './globals.css'
import { ToastContainer } from '../components/ui/toast'
import ThemeToggle from '../components/ui/theme-toggle'
import PwaSetup from '../components/pwa-setup'

export const metadata: Metadata = {
  title: 'Pitchr - AI Proposals for Nigerian Freelancers',
  description: 'Pitchr — AI proposals for Nigerian freelancers. Write winning Upwork and Fiverr proposals in 30 seconds. No subscription needed. Pay as you go.',
  manifest: '/manifest.json',
  themeColor: '#059669',
  icons: {
    icon: '/images/logo.jpg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('pitchr_theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`
        }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        {children}
        <PwaSetup />
        <ToastContainer />
        <ThemeToggle />
      </body>
    </html>
  )
}
```

---

### Task 6: Build and verify

- [ ] **Step 1: Build**

```bash
cd frontend && npm run build
```

Expected: Build succeeds with no errors. Manifest and service worker are served from `public/`.

- [ ] **Step 2: Verify in browser (manual)**

Open dev server at localhost:3000, check:
1. Network tab shows `/manifest.json` and `/sw.js` load successfully
2. Application → Manifest tab shows app name "Pitchr" and icons
3. Application → Service Workers shows registered SW
4. Chrome shows install prompt (may require HTTPS or localhost)
