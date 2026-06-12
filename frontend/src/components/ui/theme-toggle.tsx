'use client';

import { useEffect, useState } from 'react';

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-300">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pitchr_theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = stored ? stored === 'dark' : prefersDark;
      setDark(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    } catch {
      // localStorage unavailable (private mode, etc.) — stay light
    }
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('pitchr_theme', next ? 'dark' : 'light');
    } catch {
      // localStorage unavailable
    }
  }

  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-[100] w-9 h-9 rounded-lg bg-background border border-border shadow-sm flex items-center justify-center hover:shadow-md hover:border-brand-300 transition-all"
      aria-label="Toggle dark mode"
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
