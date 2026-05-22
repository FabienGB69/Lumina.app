import { storage } from "./utils/storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";
const TOKEN_KEY = "lumina_token";

let tokenInMemory: string | null = null;

export async function setToken(t: string | null) {
  tokenInMemory = t;
  if (t === null) {
    await storage.secureRemove(TOKEN_KEY);
  } else {
    await storage.secureSet(TOKEN_KEY, t);
  }
}

export async function loadToken(): Promise<string | null> {
  if (tokenInMemory) return tokenInMemory;
  const t = await storage.secureGet<string>(TOKEN_KEY, "");
  if (t) tokenInMemory = t;
  return tokenInMemory;
}

async function request<T = any>(
  path: string,
  options: { method?: string; body?: any; auth?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const t = await loadToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { detail: text };
  }
  if (!res.ok) {
    const detail =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((d: any) => d.msg).join(", ")
          : `Error ${res.status}`;
    const err = new Error(detail) as Error & { status?: number; data?: any };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export type User = {
  id: string;
  email: string;
  username: string;
  is_premium: boolean;
  onboarded: boolean;
  birth_date?: string | null;
  birth_time?: string | null;
  birth_place?: string | null;
  birth_lat?: number | null;
  birth_lng?: number | null;
};

export const api = {
  register: (email: string, username: string, password: string) =>
    request<{ access_token: string; user: User }>("/auth/register", {
      method: "POST",
      body: { email, username, password },
      auth: false,
    }),
  login: (email: string, password: string) =>
    request<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),
  me: () => request<User>("/auth/me"),
  saveBirthData: (data: {
    birth_date: string;
    birth_time: string;
    birth_place: string;
    birth_lat: number;
    birth_lng: number;
  }) => request<User>("/onboarding/birth-data", { method: "POST", body: data }),
  natalChart: () => request<{ chart: any; summary: string }>("/natal-chart"),
  horoscopeToday: () =>
    request<{ date: string; text: string; cached: boolean }>("/horoscope/today"),
  tarotDeck: () => request<{ cards: any[] }>("/tarot/deck"),
  tarotDaily: () => request<any>("/tarot/daily"),
  tarotDraw: (question?: string) =>
    request<any>("/tarot/draw", { method: "POST", body: { question: question || null } }),
  journal: () => request<{ items: any[] }>("/journal"),
  friends: () => request<{ items: any[] }>("/friends"),
  addFriend: (username: string) =>
    request<{ ok: boolean; friend: any }>("/friends/add", {
      method: "POST",
      body: { username },
    }),
  compatibility: (friend_id: string) =>
    request<any>("/friends/compatibility", { method: "POST", body: { friend_id } }),
  stripeCheckout: () =>
    request<{ url: string; session_id: string }>("/stripe/checkout", { method: "POST" }),
  stripeSession: (id: string) =>
    request<{ payment_status: string; is_premium: boolean }>(`/stripe/session/${id}`),
};
