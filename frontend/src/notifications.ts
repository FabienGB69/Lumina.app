// Local scheduled daily notifications for Lumina.
// Users can enable a morning reminder — a nudge to read today's horoscope + tarot.
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { storage } from "./utils/storage";

const NOTIF_ENABLED_KEY = "lumina_notif_enabled";
const NOTIF_HOUR_KEY = "lumina_notif_hour";
const NOTIF_MINUTE_KEY = "lumina_notif_minute";
const NOTIF_ID_KEY = "lumina_notif_id";

const DAILY_NUDGES = [
  {
    title: "The stars have opinions.",
    body: "Your daily horoscope is waiting. Try not to take it personally.",
  },
  {
    title: "Draw your card.",
    body: "Today's tarot pull is ready. The deck has been rude, as usual.",
  },
  {
    title: "Cosmic mail.",
    body: "The universe sent something. Open Lumina to read the fine print.",
  },
  {
    title: "A quiet reminder.",
    body: "Your alignment shifted overnight. Come see the damage.",
  },
];

function randomNudge() {
  return DAILY_NUDGES[Math.floor(Math.random() * DAILY_NUDGES.length)];
}

// Foreground behavior — show banner + play sound even when app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    // Legacy fields still required on some SDKs
    shouldShowAlert: true,
  } as any),
});

export type NotifPrefs = {
  enabled: boolean;
  hour: number; // 0-23
  minute: number; // 0-59
};

export async function loadPrefs(): Promise<NotifPrefs> {
  const enabled = ((await storage.getItem<boolean>(NOTIF_ENABLED_KEY, false)) as boolean) || false;
  const hour = ((await storage.getItem<number>(NOTIF_HOUR_KEY, 8)) as number) ?? 8;
  const minute = ((await storage.getItem<number>(NOTIF_MINUTE_KEY, 0)) as number) ?? 0;
  return { enabled, hour, minute };
}

async function savePrefs(prefs: NotifPrefs) {
  await storage.setItem(NOTIF_ENABLED_KEY, prefs.enabled);
  await storage.setItem(NOTIF_HOUR_KEY, prefs.hour);
  await storage.setItem(NOTIF_MINUTE_KEY, prefs.minute);
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("daily-reading", {
    name: "Daily Reading",
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: "#F0C560",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    vibrationPattern: [0, 180, 120, 180],
  });
}

/**
 * Ask for permission (best-practice: only when user opts in).
 * Returns { granted, canAskAgain }. Never throws.
 */
export async function requestPermissions(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  if (Platform.OS === "web") return { granted: false, canAskAgain: false };
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return { granted: true, canAskAgain: true };
    if (!current.canAskAgain) return { granted: false, canAskAgain: false };
    const res = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
      },
    });
    return { granted: !!res.granted, canAskAgain: res.canAskAgain ?? true };
  } catch (e) {
    console.warn("[notifications] requestPermissions failed", e);
    return { granted: false, canAskAgain: false };
  }
}

async function cancelScheduled() {
  const id = (await storage.getItem<string>(NOTIF_ID_KEY, "")) as string;
  if (id) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      /* ignore */
    }
  }
  await storage.removeItem(NOTIF_ID_KEY);
}

/**
 * Schedule a daily notification at hour:minute local time.
 * Cancels any previously-scheduled Lumina notification first.
 */
export async function scheduleDaily(
  hour: number,
  minute: number,
): Promise<string | null> {
  if (Platform.OS === "web") return null;
  await ensureAndroidChannel();
  await cancelScheduled();
  const nudge = randomNudge();
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: nudge.title,
      body: nudge.body,
      sound: true,
      data: { screen: "/(tabs)" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: "daily-reading",
    } as Notifications.DailyTriggerInput,
  });
  await storage.setItem(NOTIF_ID_KEY, id);
  return id;
}

/** Turn daily reminder ON — asks permission, schedules, persists prefs. */
export async function enableDailyReminder(hour: number, minute: number) {
  const perm = await requestPermissions();
  if (!perm.granted) {
    return { ok: false, canAskAgain: perm.canAskAgain };
  }
  await scheduleDaily(hour, minute);
  await savePrefs({ enabled: true, hour, minute });
  return { ok: true, canAskAgain: true };
}

/** Turn daily reminder OFF. */
export async function disableDailyReminder() {
  await cancelScheduled();
  const prefs = await loadPrefs();
  await savePrefs({ ...prefs, enabled: false });
}

/** Update time while keeping the reminder enabled. */
export async function updateReminderTime(hour: number, minute: number) {
  const prefs = await loadPrefs();
  if (!prefs.enabled) {
    await savePrefs({ ...prefs, hour, minute });
    return;
  }
  await scheduleDaily(hour, minute);
  await savePrefs({ enabled: true, hour, minute });
}
