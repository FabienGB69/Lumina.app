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
import { FeedbackModal } from "../../src/components/FeedbackModal";
import {
  LANG_FLAGS,
  LANG_NAMES,
  SUPPORTED_LANGS,
  useTranslation,
  type Lang,
} from "../../src/i18n";
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
  const { t, lang, setLang } = useTranslation();
  const { user, signOut, refresh } = useAuth();
  const [chart, setChart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<NotifPrefs>({ enabled: false, hour: 8, minute: 0 });
  const [busy, setBusy] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

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
      Alert.alert(t("profile.notOnWebTitle"), t("profile.notOnWebBody"));
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
          Alert.alert(t("profile.permDeniedTitle"), t("profile.permDeniedBody"), [
            { text: t("profile.cancel"), style: "cancel" },
            { text: t("profile.openSettings"), onPress: () => Linking.openSettings() },
          ]);
        } else {
          Alert.alert(t("profile.permNeededTitle"), t("profile.permNeededBody"));
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

  const changeLang = async (next: Lang) => {
    if (next === lang) return;
    await setLang(next);
    // Refresh user to pick up the persisted server-side language.
    try {
      await refresh();
    } catch {
      /* not fatal — local storage is source of truth on the client */
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <Text style={text.label}>{t("profile.label")}</Text>
          <Text style={[text.h1, { marginTop: spacing.sm }]}>@{user?.username}</Text>
          <Text style={[text.bodyDim, { marginTop: spacing.xs }]}>{user?.email}</Text>
          {user?.is_premium ? (
            <View style={s.premiumBadge}>
              <Text style={s.premiumText}>{t("profile.premiumBadge")}</Text>
            </View>
          ) : (
            <TouchableOpacity
              testID="profile-go-premium"
              style={s.premiumBtn}
              onPress={() => router.push("/paywall")}
            >
              <Text style={s.premiumBtnText}>{t("profile.goPremium")}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={s.section}>
          <Text style={text.label}>{t("profile.birthData")}</Text>
          <View style={s.kvRow}>
            <Text style={text.bodyDim}>{t("profile.date")}</Text>
            <Text style={text.body}>{user?.birth_date || "—"}</Text>
          </View>
          <View style={s.kvRow}>
            <Text style={text.bodyDim}>{t("profile.time")}</Text>
            <Text style={text.body}>{user?.birth_time || "—"}</Text>
          </View>
          <View style={s.kvRow}>
            <Text style={text.bodyDim}>{t("profile.place")}</Text>
            <Text style={text.body}>{user?.birth_place || "—"}</Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.section}>
          <Text style={text.label}>{t("profile.natalPlacements")}</Text>
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} style={{ marginTop: spacing.lg }} />
          ) : !chart ? (
            <Text style={[text.bodyDim, { marginTop: spacing.md }]}>{t("profile.unavailable")}</Text>
          ) : (
            <>
              <View style={s.bigRow}>
                <Text style={text.label}>{t("profile.sun")}</Text>
                <Text style={[text.h3]}>
                  {chart.planets.Sun.sign}{" "}
                  <Text style={text.bodyDim}>{chart.planets.Sun.degrees}°</Text>
                </Text>
              </View>
              <View style={s.bigRow}>
                <Text style={text.label}>{t("profile.moon")}</Text>
                <Text style={[text.h3]}>
                  {chart.planets.Moon.sign}{" "}
                  <Text style={text.bodyDim}>{chart.planets.Moon.degrees}°</Text>
                </Text>
              </View>
              <View style={s.bigRow}>
                <Text style={text.label}>{t("profile.rising")}</Text>
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
              <Text style={text.label}>{t("profile.dailyReminder")}</Text>
              <Text style={[text.bodyDim, { marginTop: spacing.xs, fontSize: 13 }]}>
                {t("profile.dailyReminderHint")}
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
                {t("profile.reminderCurrent", { time: fmt(prefs.hour, prefs.minute) })}
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

        <View style={s.section}>
          <Text style={text.label}>{t("profile.language")}</Text>
          <Text style={[text.bodyDim, { marginTop: spacing.xs, fontSize: 13 }]}>
            {t("profile.languageHint")}
          </Text>
          <View style={[s.timeRow, { marginTop: spacing.md }]}>
            {SUPPORTED_LANGS.map((l) => {
              const active = l === lang;
              return (
                <TouchableOpacity
                  key={l}
                  testID={`profile-lang-${l}`}
                  onPress={() => changeLang(l)}
                  style={[s.timeChip, active && s.timeChipActive]}
                >
                  <Text
                    style={[
                      s.timeChipText,
                      active && { color: colors.textOnGold ?? colors.bg },
                    ]}
                  >
                    {LANG_FLAGS[l]}  {LANG_NAMES[l]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.section}>
          <Text style={text.label}>{t("profile.feedback")}</Text>
          <Text style={[text.bodyDim, { marginTop: spacing.xs, fontSize: 13 }]}>
            {t("profile.feedbackHint")}
          </Text>
          <TouchableOpacity
            testID="profile-open-feedback"
            style={[s.timeChip, { alignSelf: "flex-start", marginTop: spacing.md }]}
            onPress={() => setShowFeedback(true)}
          >
            <Text style={s.timeChipText}>{t("profile.sendFeedback")}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.divider} />

        <TouchableOpacity testID="profile-sign-out" style={s.signOut} onPress={signOut}>
          <Text style={s.signOutText}>{t("profile.signOut")}</Text>
        </TouchableOpacity>
      </ScrollView>

      <FeedbackModal visible={showFeedback} onClose={() => setShowFeedback(false)} />
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
