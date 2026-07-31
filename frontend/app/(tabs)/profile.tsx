import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../src/api";
import { useAuth } from "../../src/auth";
import {
  disableDailyReminder,
  enableDailyReminder,
  loadPrefs,
  NotifPrefs,
  updateReminderTime,
} from "../../src/notifications";
import { colors, spacing, text } from "../../src/theme";

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
};

const TIME_PRESETS: { hour: number; minute: number; label: string }[] = [
  { hour: 7, minute: 0, label: "7:00" },
  { hour: 8, minute: 0, label: "8:00" },
  { hour: 9, minute: 30, label: "9:30" },
  { hour: 12, minute: 0, label: "12:00" },
  { hour: 18, minute: 0, label: "18:00" },
  { hour: 21, minute: 0, label: "21:00" },
];

function fmt(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const [chart, setChart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<NotifPrefs>({ enabled: false, hour: 8, minute: 0 });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.natalChart();
      setChart(r.chart);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void (async () => {
      const p = await loadPrefs();
      setPrefs(p);
    })();
  }, [load]);

  const toggleReminder = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Not on web",
        "Daily reminders are a mobile-only feature. Open Lumina on your phone.",
      );
      return;
    }
    setBusy(true);
    try {
      if (prefs.enabled) {
        await disableDailyReminder();
        setPrefs({ ...prefs, enabled: false });
      } else {
        const res = await enableDailyReminder(prefs.hour, prefs.minute);
        if (res.ok) {
          setPrefs({ ...prefs, enabled: true });
        } else if (!res.canAskAgain) {
          Alert.alert(
            "Permission denied",
            "Enable notifications for Lumina from the system settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ],
          );
        } else {
          Alert.alert("Permission needed", "Allow notifications to receive daily nudges.");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const pickTime = async (hour: number, minute: number) => {
    if (Platform.OS === "web") return;
    setBusy(true);
    try {
      await updateReminderTime(hour, minute);
      setPrefs({ ...prefs, hour, minute });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <Text style={text.label}>PROFILE</Text>
          <Text style={[text.h1, { marginTop: spacing.sm }]}>@{user?.username}</Text>
          <Text style={[text.bodyDim, { marginTop: spacing.xs }]}>{user?.email}</Text>
          {user?.is_premium ? (
            <View style={s.premiumBadge}>
              <Text style={s.premiumText}>LUMINA PREMIUM</Text>
            </View>
          ) : (
            <TouchableOpacity
              testID="profile-go-premium"
              style={s.premiumBtn}
              onPress={() => router.push("/paywall")}
            >
              <Text style={s.premiumBtnText}>GO PREMIUM</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={s.section}>
          <Text style={text.label}>Birth data</Text>
          <View style={s.kvRow}>
            <Text style={text.bodyDim}>Date</Text>
            <Text style={text.body}>{user?.birth_date || "—"}</Text>
          </View>
          <View style={s.kvRow}>
            <Text style={text.bodyDim}>Time</Text>
            <Text style={text.body}>{user?.birth_time || "—"}</Text>
          </View>
          <View style={s.kvRow}>
            <Text style={text.bodyDim}>Place</Text>
            <Text style={text.body}>{user?.birth_place || "—"}</Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.section}>
          <Text style={text.label}>Natal placements</Text>
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} style={{ marginTop: spacing.lg }} />
          ) : !chart ? (
            <Text style={[text.bodyDim, { marginTop: spacing.md }]}>Unavailable.</Text>
          ) : (
            <>
              <View style={s.bigRow}>
                <Text style={text.label}>SUN</Text>
                <Text style={[text.h3]}>
                  {chart.planets.Sun.sign}{" "}
                  <Text style={text.bodyDim}>{chart.planets.Sun.degrees}°</Text>
                </Text>
              </View>
              <View style={s.bigRow}>
                <Text style={text.label}>MOON</Text>
                <Text style={[text.h3]}>
                  {chart.planets.Moon.sign}{" "}
                  <Text style={text.bodyDim}>{chart.planets.Moon.degrees}°</Text>
                </Text>
              </View>
              <View style={s.bigRow}>
                <Text style={text.label}>RISING</Text>
                <Text style={[text.h3]}>
                  {chart.ascendant.sign}{" "}
                  <Text style={text.bodyDim}>{chart.ascendant.degrees}°</Text>
                </Text>
              </View>

              <View style={{ height: spacing.md }} />

              {Object.entries(chart.planets).map(([planet, p]: any) => (
                <View key={planet} style={s.miniRow} testID={`natal-${planet}`}>
                  <Text style={[text.body, { color: colors.textSecondary, width: 30 }]}>
                    {PLANET_SYMBOLS[planet] || ""}
                  </Text>
                  <Text style={[text.body, { flex: 1 }]}>{planet}</Text>
                  <Text style={text.body}>
                    {p.sign} {p.degrees}°{p.retrograde ? " ℞" : ""}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={s.divider} />

        <View style={s.section}>
          <View style={s.reminderHeader}>
            <View style={{ flex: 1 }}>
              <Text style={text.label}>Daily reminder</Text>
              <Text style={[text.bodyDim, { marginTop: spacing.xs, fontSize: 13 }]}>
                A local nudge, once a day, to check your horoscope and pull a card.
              </Text>
            </View>
            <TouchableOpacity
              testID="profile-notif-toggle"
              onPress={toggleReminder}
              disabled={busy}
              style={[
                s.toggle,
                prefs.enabled && s.toggleOn,
                busy && { opacity: 0.5 },
              ]}
              accessibilityRole="switch"
              accessibilityState={{ checked: prefs.enabled }}
            >
              <View style={[s.toggleDot, prefs.enabled && s.toggleDotOn]} />
            </TouchableOpacity>
          </View>

          {prefs.enabled ? (
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              <Text style={[text.bodyDim, { fontSize: 13 }]}>
                Currently: <Text style={{ color: colors.gold }}>{fmt(prefs.hour, prefs.minute)}</Text>
              </Text>
              <View style={s.timeRow}>
                {TIME_PRESETS.map((p) => {
                  const active = p.hour === prefs.hour && p.minute === prefs.minute;
                  return (
                    <TouchableOpacity
                      key={p.label}
                      testID={`profile-notif-time-${p.label}`}
                      onPress={() => pickTime(p.hour, p.minute)}
                      disabled={busy}
                      style={[s.timeChip, active && s.timeChipActive]}
                    >
                      <Text
                        style={[
                          s.timeChipText,
                          active && { color: colors.textOnGold ?? colors.bg },
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>

        <View style={s.divider} />

        <TouchableOpacity testID="profile-sign-out" style={s.signOut} onPress={signOut}>
          <Text style={s.signOutText}>SIGN OUT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xxl },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  premiumBadge: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  premiumText: {
    color: colors.gold,
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
  },
  premiumBtn: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  premiumBtnText: {
    color: colors.gold,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 2,
  },
  section: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  bigRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  miniRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  signOut: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  signOutText: {
    color: colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 2,
  },
  reminderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  toggle: {
    width: 52,
    height: 30,
    borderRadius: 999,
    backgroundColor: colors.border,
    padding: 3,
    justifyContent: "center",
  },
  toggleOn: {
    backgroundColor: colors.gold,
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.textPrimary,
  },
  toggleDotOn: {
    backgroundColor: colors.bg,
    transform: [{ translateX: 22 }],
  },
  timeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  timeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  timeChipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  timeChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1,
    color: colors.textSecondary,
  },
});
