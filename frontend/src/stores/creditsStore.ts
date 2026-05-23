import { create } from "zustand";
import { api, CreditsInfo } from "../api";

type CreditsState = {
  credits: number | null;
  resetAt: string | null;
  isPremium: boolean;
  loading: boolean;
  // Actions
  fetch: () => Promise<void>;
  decrement: () => void;
};

export const useCreditsStore = create<CreditsState>((set, get) => ({
  credits: null,
  resetAt: null,
  isPremium: false,
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const data: CreditsInfo = await api.credits();
      set({
        credits: data.credits,
        resetAt: data.reset_at,
        isPremium: data.is_premium,
      });
    } catch {
      // silently fail — credit display is non-critical
    } finally {
      set({ loading: false });
    }
  },

  // Optimistic decrement after a successful draw (avoids refetch)
  decrement: () => {
    const { credits, isPremium } = get();
    if (!isPremium && credits !== null && credits > 0) {
      set({ credits: credits - 1 });
    }
  },
}));
