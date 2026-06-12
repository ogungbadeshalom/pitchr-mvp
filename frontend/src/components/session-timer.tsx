'use client';
import { useEffect, useState } from 'react';
import { useSessionStore } from '../store/sessionStore';

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SessionTimer() {
  const expiresAt = useSessionStore((s) => s.expiresAt);
  const plan = useSessionStore((s) => s.plan);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;
    const deadline = expiresAt;

    function tick() {
      setRemaining(deadline - Date.now());
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt || !plan || remaining <= 0) return null;

  const isLow = remaining < 5 * 60 * 1000;

  return (
    <span className={`flex items-center gap-1.5 text-sm ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isLow ? 'text-amber-500' : 'text-brand-500'}
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {formatTime(remaining)}
    </span>
  );
}
