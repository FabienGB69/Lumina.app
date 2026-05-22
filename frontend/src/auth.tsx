import React, { createContext, useContext, useEffect, useState } from "react";
import { api, loadToken, setToken, User } from "./api";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await loadToken();
        if (t) {
          const u = await api.me();
          setUser(u);
        }
      } catch {
        await setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { access_token, user: u } = await api.login(email, password);
    await setToken(access_token);
    setUser(u);
  };
  const signUp = async (email: string, username: string, password: string) => {
    const { access_token, user: u } = await api.register(email, username, password);
    await setToken(access_token);
    setUser(u);
  };
  const signOut = async () => {
    await setToken(null);
    setUser(null);
  };
  const refresh = async () => {
    const u = await api.me();
    setUser(u);
  };

  return (
    <Ctx.Provider value={{ user, loading, signIn, signUp, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
