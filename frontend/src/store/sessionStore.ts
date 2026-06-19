import { create } from 'zustand';

const STORAGE_KEY = 'pitchr_session';
const STORAGE_VERSION = 1;

interface PersistedSession {
  v: typeof STORAGE_VERSION;
  token: string;
  plan: 'flash' | 'power';
  expiresAt: number;
  proposalsUsed: number;
  proposalsLimit: number;
}

interface SessionState {
  token: string | null;
  plan: 'flash' | 'power' | null;
  expiresAt: number | null;
  proposalsUsed: number;
  proposalsLimit: number;
  setSession: (token: string, plan: 'flash' | 'power', expiresAt: number, limit: number, proposalsUsed?: number) => void;
  incrementUsed: () => void;
  clearSession: () => void;
  rehydrate: () => void;
  hydrated: boolean;
}

function loadFromStorage(): Partial<SessionState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as PersistedSession;
    if (!data.v || data.v !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return {};
    }
    return { token: data.token, plan: data.plan, expiresAt: data.expiresAt, proposalsUsed: data.proposalsUsed, proposalsLimit: data.proposalsLimit, hydrated: true };
  } catch {
    return {};
  }
}

function saveToStorage(state: { token: string; plan: string; expiresAt: number; proposalsUsed: number; proposalsLimit: number }) {
  if (typeof window === 'undefined') return;
  try {
    const data: PersistedSession = { v: STORAGE_VERSION, ...state, plan: state.plan as 'flash' | 'power' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* storage full */ }
}

function clearStorage() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export const useSessionStore = create<SessionState>((set, get) => ({
  token: null,
  plan: null,
  expiresAt: null,
  proposalsUsed: 0,
  proposalsLimit: 0,
  hydrated: false,
  ...loadFromStorage(),

  setSession: (token, plan, expiresAt, limit, proposalsUsed = 0) => {
    const data = { token, plan, expiresAt, proposalsUsed, proposalsLimit: limit };
    set({ ...data, hydrated: true });
    saveToStorage(data);
  },

  incrementUsed: () => {
    const s = get();
    if (!s.token || !s.plan || !s.expiresAt) return;
    const updated = { proposalsUsed: s.proposalsUsed + 1 };
    set(updated);
    saveToStorage({ token: s.token, plan: s.plan, expiresAt: s.expiresAt, proposalsLimit: s.proposalsLimit, ...updated });
  },

  clearSession: () => {
    set({ token: null, plan: null, expiresAt: null, proposalsUsed: 0, proposalsLimit: 0, hydrated: true });
    clearStorage();
  },

  rehydrate: () => {
    const stored = loadFromStorage();
    set({ ...stored, hydrated: true });
  },
}));
