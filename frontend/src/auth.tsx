import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { api, loadToken, setToken, User } from "./api";
import {
  signInWithGoogle as googleSignIn,
  tryConsumeNativeInitialUrl,
  tryConsumeWebRedirect,
} from "./googleAuth";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, username: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<User | null>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Web: check URL for session_id first (redirect landing)
        if (Platform.OS === "web") {
          const redirected = await tryConsumeWebRedirect();
          if (redirected?.user) {
            if (!cancelled) setUser(redirected.user);
            return;
          }
        } else {
          // Native cold-start deep link
          const cold = await tryConsumeNativeInitialUrl();
          if (cold?.user) {
            if (!cancelled) setUser(cold.user);
            return;
          }
        }
        // Existing session
        const t = await loadToken();
        if (t) {
          const u = await api.me();
          if (!cancelled) setUser(u);
        }
      } catch {
        await setToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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
  const signInWithGoogleFn = async () => {
    const res = await googleSignIn();
    if (res?.user) {
      setUser(res.user);
      return res.user as User;
    }
    return null;
  };
  const signOut = async () => {
    try {
      await api.logout();
    } catch {
      /* best-effort */
    }
    await setToken(null);
    setUser(null);
  };
  const refresh = async () => {
    const u = await api.me();
    setUser(u);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle: signInWithGoogleFn,
        signOut,
        refresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
