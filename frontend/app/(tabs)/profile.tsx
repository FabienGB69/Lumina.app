import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../src/api";
import { useAuth } from "../../src/auth";
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

export default function Profile() {
  const { user, signOut } = useAuth();
  const [chart, setChart] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
  }, [load]);

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
});
