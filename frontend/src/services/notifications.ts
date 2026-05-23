/**
 * Lumina push notification service.
 *
 * Local scheduled notifications run even when the app is closed.
 * Remote push token is registered with the backend for server-side delivery.
 */
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "../api";

// ---------------------------------------------------------------------------
// Global handler — shows notifications while app is in foreground
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
const CHANNEL_DAILY = "lumina_daily";
const CHANNEL_ALERTS = "lumina_alerts";

// ---------------------------------------------------------------------------
// Android channel setup
// ---------------------------------------------------------------------------
async function _ensureChannels() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_DAILY, {
    name: "Tirage du jour",
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: "#6B2D8C",
    vibrationPattern: [0, 250, 100, 250],
    showBadge: false,
  });
  await Notifications.setNotificationChannelAsync(CHANNEL_ALERTS, {
    name: "Alertes Lumina",
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: "#D4AF37",
    vibrationPattern: [0, 350],
    showBadge: true,
  });
}

// ---------------------------------------------------------------------------
// Permission request
// ---------------------------------------------------------------------------
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  await _ensureChannels();

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
// Helpers
// ---------------------------------------------------------------------------
function _androidProps(channelId: string) {
  return Platform.OS === "android"
    ? {
        channelId,
        color: "#6B2D8C",
        smallIcon: "notification_icon",
      }
    : {};
}

// ---------------------------------------------------------------------------
// Daily credit reset notification — scheduled at 9:00 local time every day
// ---------------------------------------------------------------------------
const DAILY_NOTIF_ID_KEY = "lumina_daily_notif_id";

export async function scheduleDailyReset() {
  // Cancel any previously scheduled daily notification
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of existing) {
    if ((n.content.data as any)?.type === "daily_reset") {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Lumina ✦",
      body: "Tes 3 crédits ont été renouvelés. Les cartes t'attendent.",
      data: { type: "daily_reset", screen: "/(tabs)/tarot" },
      ..._androidProps(CHANNEL_DAILY),
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
// Credits exhausted notification — sent immediately (local)
// ---------------------------------------------------------------------------
export async function notifyCreditsExhausted() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Lumina ✦",
      body: "Les cartes ont encore des choses à te dire… Reviens demain ou passe en Lumina Glow.",
      data: { type: "credits_exhausted", screen: "/subscription" },
      ..._androidProps(CHANNEL_ALERTS),
    },
    trigger: null, // immediate
  });
}

// ---------------------------------------------------------------------------
// Welcome after subscription — sent immediately (local)
// ---------------------------------------------------------------------------
export async function notifySubscriptionSuccess() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Lumina ✦",
      body: "Bienvenue dans Lumina Glow ✨ Profite de tes tirages illimités.",
      data: { type: "subscription_success", screen: "/(tabs)" },
      ..._androidProps(CHANNEL_ALERTS),
    },
    trigger: null,
  });
}

// ---------------------------------------------------------------------------
// Streak reminder — scheduled 48h after last open (call on every app open,
// cancel+reschedule so it resets the clock each time)
// ---------------------------------------------------------------------------
export async function scheduleStreakReminder() {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of existing) {
    if ((n.content.data as any)?.type === "streak_reminder") {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Lumina ✦",
      body: "Ça fait deux jours. Les cartes n'ont pas oublié. Toi ?",
      data: { type: "streak_reminder", screen: "/(tabs)/tarot" },
      ..._androidProps(CHANNEL_DAILY),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 48 * 60 * 60,
      repeats: false,
    },
  });
}

// ---------------------------------------------------------------------------
// Register Expo push token with backend
// ---------------------------------------------------------------------------
export async function registerPushToken() {
  if (!Device.isDevice) return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    await api.registerPushToken(tokenData.data);
  } catch {
    // Non-fatal — push delivery is best-effort
  }
}

// ---------------------------------------------------------------------------
// Navigation handler — call once at app root to handle taps on notifications
// ---------------------------------------------------------------------------
export function addNotificationResponseListener(
  navigate: (screen: string) => void,
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const screen = response.notification.request.content.data?.screen as string | undefined;
    if (screen) navigate(screen);
  });
}
