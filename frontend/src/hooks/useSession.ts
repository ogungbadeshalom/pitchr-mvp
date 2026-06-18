'use client';
import { useEffect } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useToastStore } from '../store/toastStore';
import { fetchActiveSession } from '../lib/api';

export function useSession() {
  const { token, expiresAt, proposalsUsed, proposalsLimit, hydrated, clearSession, rehydrate, setSession } = useSessionStore();

  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  useEffect(() => {
    if (!token || !expiresAt) return;

    const sync = async () => {
      try {
        const session = await fetchActiveSession();
        if (!session) {
          clearSession();
          useToastStore.getState().addToast('Session expired. Purchase a new session to continue.', 'warning');
        } else {
          setSession(session.token, session.plan, session.expiresAt, session.proposalsLimit);
        }
      } catch {
        // Network error — keep local session state, retry later
      }
    };

    sync();
    const interval = setInterval(sync, 30000);
    return () => clearInterval(interval);
  }, [token, expiresAt, clearSession, setSession]);

  return {
    hydrated,
    isValid: !!token && !!expiresAt && proposalsUsed < proposalsLimit,
    remaining: hydrated ? Math.max(0, proposalsLimit - proposalsUsed) : 0,
    isExpired: false,
  };
}
