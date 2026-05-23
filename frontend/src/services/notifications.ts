/**
 * Lumina push notification service.
 *
 * Channels (Android):
 *   lumina_daily      — daily credit reset + streak reminders (importance HIGH, violet light)
 *   lumina_credits    — credits exhausted alert (importance HIGH, gold light)
 *   lumina_promo      — subscription welcome + marketing (importance DEFAULT, no sound)
 *
 * Local scheduled notifications run even when the app is closed.
 * Remote push token is registered with the backend for server-side delivery.
 */
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "../api";

// ---------------------------------------------------------------------------
// Global handler — shows banners while app is in foreground
// ---------------------------------------------------------------------------
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ---------------------------------------------------------------------------
// Channel IDs
// ---------------------------------------------------------------------------
export const CHANNEL_DAILY   = "lumina_daily";
export const CHANNEL_CREDITS = "lumina_credits";
export const CHANNEL_PROMO   = "lumina_promo";

// ---------------------------------------------------------------------------
// Android channel setup — idempotent, safe to call on every launch
// ---------------------------------------------------------------------------
export async function ensureNotificationChannels(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(CHANNEL_DAILY, {
    name: "Tirage du jour",
    description: "Rappels quotidiens et renouvellement de crédits",
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: "#6B2D8C",
    enableLights: true,
    enableVibrate: true,
    vibrationPattern: [0, 300, 150, 300],
    showBadge: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });

  await Notifications.setNotificationChannelAsync(CHANNEL_CREDITS, {
    name: "Crédits",
    description: "Alertes quand tes crédits sont épuisés",
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: "#D4AF37",
    enableLights: true,
    enableVibrate: true,
    vibrationPattern: [0, 400],
    showBadge: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });

  await Notifications.setNotificationChannelAsync(CHANNEL_PROMO, {
    name: "Offres & Abonnements",
    description: "Messages de bienvenue et offres Lumina",
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: "#E8B4C8",
    enableLights: true,
    enableVibrate: false,
    showBadge: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
}

// ---------------------------------------------------------------------------
// Permission request — must be called after ensureNotificationChannels
// ---------------------------------------------------------------------------
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  await ensureNotificationChannels();

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: false,
    },
  });
  return status === "granted";
}

// ---------------------------------------------------------------------------
// Internal helper — injects Android channel + accent colour
// ---------------------------------------------------------------------------
function _android(channelId: string, color = "#6B2D8C") {
  return Platform.OS === "android"
    ? { channelId, color, smallIcon: "notification_icon" }
    : {};
}

// ---------------------------------------------------------------------------
// Daily credit reset — scheduled at 09:00 local time, repeating
// ---------------------------------------------------------------------------
export async function scheduleDailyReset(): Promise<void> {
  // Cancel any existing daily reset to avoid duplicates
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if ((n.content.data as any)?.type === "daily_reset") {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Lumina ✦",
      body: "Tes 3 crédits ont été renouvelés. Les cartes t'attendent.",
      data: { type: "daily_reset", screen: "/(tabs)/tarot" },
      ..._android(CHANNEL_DAILY),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      repeats: true,
      hour: 9,
      minute: 0,
    },
  });
}

// ---------------------------------------------------------------------------
// Streak reminder — reschedule every app open so it resets the 48h clock
// ---------------------------------------------------------------------------
export async function scheduleStreakReminder(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if ((n.content.data as any)?.type === "streak_reminder") {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Lumina ✦",
      body: "Ça fait deux jours. Les cartes n'ont pas oublié. Toi ?",
      data: { type: "streak_reminder", screen: "/(tabs)/tarot" },
      ..._android(CHANNEL_DAILY),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 48 * 60 * 60,
      repeats: false,
    },
  });
}

// ---------------------------------------------------------------------------
// Credits exhausted — immediate local notification
// ---------------------------------------------------------------------------
export async function notifyCreditsExhausted(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Lumina ✦",
      body: "Les cartes ont encore des choses à te dire… Reviens demain ou passe en Lumina Glow.",
      data: { type: "credits_exhausted", screen: "/subscription" },
      ..._android(CHANNEL_CREDITS, "#D4AF37"),
    },
    trigger: null,
  });
}

// ---------------------------------------------------------------------------
// Subscription welcome — immediate local notification (promo channel)
// ---------------------------------------------------------------------------
export async function notifySubscriptionSuccess(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Lumina ✦",
      body: "Bienvenue dans Lumina Glow ✨ Profite de tes tirages illimités.",
      data: { type: "subscription_success", screen: "/(tabs)" },
      ..._android(CHANNEL_PROMO, "#E8B4C8"),
    },
    trigger: null,
  });
}

// ---------------------------------------------------------------------------
// Register Expo push token with backend (best-effort, non-fatal)
// ---------------------------------------------------------------------------
export async function registerPushToken(): Promise<void> {
  if (!Device.isDevice) return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    await api.registerPushToken(tokenData.data);
  } catch {
    // Push delivery is best-effort; network or token errors don't block the app
  }
}

// ---------------------------------------------------------------------------
// Navigation on notification tap — wire into root layout
// ---------------------------------------------------------------------------
export function addNotificationResponseListener(
  navigate: (screen: string) => void,
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const screen = response.notification.request.content.data?.screen as string | undefined;
    if (screen) navigate(screen);
  });
}
