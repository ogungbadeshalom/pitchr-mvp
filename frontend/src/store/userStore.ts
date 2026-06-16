import { create } from 'zustand';

interface UserState {
  userId: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  subscriptionTier: string;
  billingPeriod: string | null;
  proposalCount: number;
  proposalLimit: number;
  setUser: (userId: string, email: string, firstName: string | null, lastName: string | null, tier: string, proposalCount?: number, proposalLimit?: number, billingPeriod?: string | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  email: null,
  firstName: null,
  lastName: null,
  subscriptionTier: 'free',
  billingPeriod: null,
  proposalCount: 0,
  proposalLimit: 0,
  setUser: (userId, email, firstName, lastName, tier, proposalCount = 0, proposalLimit = 0, billingPeriod = null) =>
    set({ userId, email, firstName, lastName, subscriptionTier: tier, proposalCount, proposalLimit, billingPeriod }),
  clearUser: () =>
    set({ userId: null, email: null, firstName: null, lastName: null, subscriptionTier: 'free', billingPeriod: null, proposalCount: 0, proposalLimit: 0 }),
}));
