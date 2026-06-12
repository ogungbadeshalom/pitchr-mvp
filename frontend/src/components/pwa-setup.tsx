'use client';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaSetup() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (matchMedia('(display-mode: standalone)').matches) {
      setShowInstall(false);
    }

    window.addEventListener('appinstalled', () => {
      setShowInstall(false);
      setDeferredPrompt(null);
    });

    try {
      const last = localStorage.getItem('pitchr_pwa_dismissed');
      if (last && Date.now() - Number(last) < 7 * 24 * 60 * 60 * 1000) {
        setShowInstall(false);
      }
    } catch {}

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
    try { localStorage.setItem('pitchr_pwa_dismissed', String(Date.now())); } catch {}
  }

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
