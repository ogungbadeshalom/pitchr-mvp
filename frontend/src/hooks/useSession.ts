'use client';
import { useEffect, useRef } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useToastStore } from '../store/toastStore';
import { fetchActiveSession } from '../lib/api';

export function useSession() {
  const { token, expiresAt, proposalsUsed, proposalsLimit, hydrated, clearSession, rehydrate, setSession } = useSessionStore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

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
          setSession(session.token, session.plan, session.expiresAt, session.proposalsLimit, session.proposalsUsed);
        }
      } catch {
        // Network error — keep local session state, retry later
      }
    };

    sync();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(sync, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token, expiresAt, clearSession, setSession]);

  const isExpired = !!expiresAt && Date.now() > expiresAt;

  return {
    hydrated,
    isValid: !!token && !!expiresAt && !isExpired && proposalsUsed < proposalsLimit,
    remaining: hydrated ? Math.max(0, proposalsLimit - proposalsUsed) : 0,
    isExpired,
  };
}
