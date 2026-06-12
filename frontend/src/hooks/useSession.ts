'use client';
import { useEffect } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useToastStore } from '../store/toastStore';

export function useSession() {
  const { token, expiresAt, proposalsUsed, proposalsLimit, hydrated, clearSession, rehydrate } = useSessionStore();

  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  useEffect(() => {
    if (!token || !expiresAt) return;
    const check = setInterval(() => {
      if (Date.now() > expiresAt) {
        clearSession();
        useToastStore.getState().addToast('Session expired. Purchase a new session to continue.', 'warning');
      }
    }, 10000);
    return () => clearInterval(check);
  }, [token, expiresAt, clearSession]);

  const validToken = !!token && !!expiresAt;
  const notExpired = validToken && Date.now() < expiresAt;
  const hasRemaining = notExpired && proposalsUsed < proposalsLimit;

  return {
    hydrated,
    isValid: hasRemaining,
    remaining: hydrated ? Math.max(0, proposalsLimit - proposalsUsed) : 0,
    isExpired: validToken && Date.now() > expiresAt,
  };
}
