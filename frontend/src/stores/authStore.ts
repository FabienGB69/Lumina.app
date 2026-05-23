import { create } from "zustand";
import { api, loadToken, setToken, User } from "../api";

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  // Actions
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: User | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: true,

  init: async () => {
    try {
      const t = await loadToken();
      if (t) {
        const u = await api.me();
        set({ user: u, token: t });
      }
    } catch {
      await setToken(null);
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    const { access_token, user } = await api.login(email, password);
    await setToken(access_token);
    set({ user, token: access_token });
  },

  signUp: async (email, username, password) => {
    const { access_token, user } = await api.register(email, username, password);
    await setToken(access_token);
    set({ user, token: access_token });
  },

  signOut: async () => {
    await setToken(null);
    set({ user: null, token: null });
  },

  refresh: async () => {
    const u = await api.me();
    set({ user: u });
  },

  setUser: (user) => set({ user }),
}));
