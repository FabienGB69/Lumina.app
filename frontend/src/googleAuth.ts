// Google Auth via Emergent OAuth — platform-aware flow.
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { api, setToken } from "./api";

// Complete any pending web-browser auth session on module load (mobile).
WebBrowser.maybeCompleteAuthSession();

const AUTH_HOST = "https://auth.emergentagent.com/";

// Track already-exchanged session_ids to avoid double POST on re-mount/deep-link races.
const consumed = new Set<string>();

function extractSessionId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/[?#&]session_id=([^&#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function buildAuthUrl(redirectUrl: string) {
  return `${AUTH_HOST}?redirect=${encodeURIComponent(redirectUrl)}`;
}

async function exchange(sessionId: string) {
  if (consumed.has(sessionId)) return null;
  consumed.add(sessionId);
  const res = await api.googleSession(sessionId);
  await setToken(res.access_token);
  return res.user;
}

/**
 * Trigger the Google sign-in flow.
 * - Web: full-page redirect to the Emergent auth host.
 * - Mobile: opens ASWebAuthenticationSession / Custom Tabs and returns via deep link.
 *   Returns the User on success, or null if the flow was cancelled with no data.
 */
export async function signInWithGoogle(): Promise<{ user: any } | null> {
  if (Platform.OS === "web") {
    const redirectUrl = window.location.origin + "/";
    window.location.href = buildAuthUrl(redirectUrl);
    return null;
  }

  const redirectUrl = Linking.createURL("");

  // Register a URL listener BEFORE opening the browser — some Android
  // devices return via deep link rather than through the WebBrowser result.
  let capturedUrl: string | null = null;
  const sub = Linking.addEventListener("url", (evt) => {
    capturedUrl = evt.url;
  });

  try {
    const result = await WebBrowser.openAuthSessionAsync(
      buildAuthUrl(redirectUrl),
      redirectUrl,
    );

    // Try (a) result.url, (b) listener-captured URL, (c) getInitialURL
    let sessionId = extractSessionId((result as any)?.url);
    if (!sessionId) sessionId = extractSessionId(capturedUrl);
    if (!sessionId) {
      const initial = await Linking.getInitialURL();
      sessionId = extractSessionId(initial);
    }
    if (!sessionId) return null;

    const user = await exchange(sessionId);
    return user ? { user } : null;
  } finally {
    sub.remove();
  }
}

/**
 * Called on app mount (web only) to complete a session that came back
 * as a URL hash/query. Returns the user on success, null otherwise.
 * On native, cold-start deep links are checked via Linking.getInitialURL
 * inside AuthProvider.
 */
export async function tryConsumeWebRedirect(): Promise<{ user: any } | null> {
  if (Platform.OS !== "web") return null;
  const url = window.location.href;
  const sessionId = extractSessionId(url);
  if (!sessionId) return null;
  try {
    const user = await exchange(sessionId);
    if (user) {
      // Clean the session_id from the URL, preserving other params.
      try {
        const u = new URL(url);
        u.hash = u.hash.replace(/([?#&])session_id=[^&]*/g, "").replace(/^#$/, "");
        const params = u.searchParams;
        params.delete("session_id");
        u.search = params.toString() ? `?${params.toString()}` : "";
        window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
      } catch {
        /* ignore URL cleanup errors */
      }
      return { user };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Native cold-start / hot deep-link handler.
 * Returns the user if a session_id was found and successfully exchanged.
 */
export async function tryConsumeNativeInitialUrl(): Promise<{ user: any } | null> {
  if (Platform.OS === "web") return null;
  const initial = await Linking.getInitialURL();
  const sid = extractSessionId(initial);
  if (!sid) return null;
  const user = await exchange(sid);
  return user ? { user } : null;
}
