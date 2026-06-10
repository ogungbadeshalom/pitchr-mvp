# Dark Mode — Design

## Strategy

- **Tailwind `darkMode: 'class'`** — `.dark` class toggled on `<html>` element
- **CSS variables** — dark values under `.dark` selector in `globals.css`
- **localStorage persistence** — key `pitchr_theme`: `'dark'`, `'light'`, or absent (system)
- **System preference fallback** — `prefers-color-scheme: dark` when no stored preference
- **Flash prevention** — inline `<script>` in root layout `<head>` reads storage and sets class before paint

## Files to Change

### 1. `tailwind.config.ts`
Add `darkMode: 'class'`.

### 2. `globals.css`
Add `.dark` block with dark variants of neutral CSS variables. Brand/teal colors stay unchanged (they work on both backgrounds).

### 3. `src/components/ui/theme-toggle.tsx` (new)
Small fixed button in top-right corner (`fixed top-4 right-4 z-[100]`).

- Shows sun icon in light mode, moon icon in dark mode
- On click: toggle `.dark` on `document.documentElement`, write to `localStorage('pitchr_theme')`
- On mount: read `localStorage`, fallback to `matchMedia('prefers-color-scheme: dark')`, apply class
- `useEffect` with empty deps for mount-only read; no reactive listeners needed

### 4. `src/app/layout.tsx`
- Add inline `<script>` in `<head>` that reads `localStorage('pitchr_theme')` and applies `.dark` class before React hydrates
- Import and render `<ThemeToggle />` component

## CSS Variables — Dark Values

```css
.dark {
  --background: 210 40% 8%;
  --foreground: 210 20% 90%;
  --card: 210 40% 10%;
  --card-foreground: 210 20% 88%;
  --popover: 210 40% 10%;
  --popover-foreground: 210 20% 88%;
  --primary: 160 84% 39%;
  --primary-foreground: 0 0% 100%;
  --secondary: 160 50% 15%;
  --secondary-foreground: 160 60% 80%;
  --muted: 210 30% 15%;
  --muted-foreground: 210 20% 60%;
  --accent: 170 80% 40%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 70% 50%;
  --destructive-foreground: 0 0% 100%;
  --border: 210 30% 18%;
  --input: 210 30% 18%;
  --ring: 160 84% 39%;
}
```

No changes to the brand palette — the existing emerald/teal colors have enough contrast against dark backgrounds.

## Theme Toggle Component

```tsx
'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('pitchr_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('pitchr_theme', next ? 'dark' : 'light');
  }

  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-[100] w-9 h-9 rounded-lg bg-white dark:bg-gray-800 border border-brand-100 dark:border-gray-700 shadow-sm flex items-center justify-center hover:shadow-md transition-all"
      aria-label="Toggle dark mode"
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
```

## Flash Prevention

In `layout.tsx`, add before `<body>`:

```tsx
<head>
  <script dangerouslySetInnerHTML={{
    __html: `(function(){try{var t=localStorage.getItem('pitchr_theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`
  }} />
</head>
```

## Edge Cases

- **localStorage blocked/private mode**: `try/catch` in the inline script and in `useEffect` — silently falls back to light
- **SSR**: The `useEffect` approach means server render always shows light (no FOUC) — the inline script handles pre-hydration
- **No stored preference**: Falls back to `prefers-color-scheme` media query
- **Existing hardcoded `bg-white` classes**: The CSS variable approach means `bg-white` stays white in dark mode, which is correct for cards/containers that should remain light. For elements that need dark, the existing pattern uses `bg-{color}` classes which will naturally adapt via the CSS variables.
