import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../src/api";
import { useAuth } from "../../src/auth";
import { useCreditsStore } from "../../src/stores/creditsStore";
import { TarotCardVisual } from "../../src/TarotCard";
import { getCardById, useDeck } from "../../src/deck";
import { colors, fonts, spacing, text } from "../../src/theme";

function todayLabel() {
  const d = new Date();
  return d
    .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    .toUpperCase();
}

function CreditPill() {
  const { credits, isPremium, fetch } = useCreditsStore();

  useEffect(() => {
    void fetch();
  }, [fetch]);

  if (isPremium) return null;
  if (credits === null) return null;

  const isEmpty = credits === 0;

  return (
    <TouchableOpacity
      style={[s.pill, isEmpty && s.pillEmpty]}
      onPress={() => router.push("/subscription")}
      activeOpacity={0.8}
    >
      <Text style={[s.pillText, isEmpty && s.pillTextEmpty]}>
        {isEmpty ? "NO CREDITS · UPGRADE" : `✦ ${credits} CREDIT${credits === 1 ? "" : "S"}`}
      </Text>
    </TouchableOpacity>
  );
}

export default function Today() {
  const { user } = useAuth();
  const deck = useDeck();
  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [dailyCard, setDailyCard] = useState<any>(null);
  const [loadingH, setLoadingH] = useState(true);
  const [loadingC, setLoadingC] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { fetch: fetchCredits } = useCreditsStore();

  const load = useCallback(async () => {
    setError(null);
    try {
      const [h, c] = await Promise.all([api.horoscopeToday(), api.tarotDaily()]);
      setHoroscope(h.text);
      setDailyCard(c);
    } catch (e: any) {
      setError(e.message || "Could not load");
    } finally {
      setLoadingH(false);
      setLoadingC(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), fetchCredits()]);
    setRefreshing(false);
  };

  const cardMeta = dailyCard ? getCardById(deck, dailyCard.card_id) : null;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
        }
      >
        <View style={s.header}>
          <View style={s.headerRow}>
            <View>
              <Text style={text.label}>{todayLabel()}</Text>
              <Text style={[text.h2, { marginTop: spacing.xs }]}>Hi, {user?.username}.</Text>
            </View>
            <CreditPill />
          </View>
        </View>

        <View style={s.section}>
          <Text style={text.label}>Today&apos;s horoscope</Text>
          {loadingH ? (
            <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.lg }} />
          ) : error && !horoscope ? (
            <Text style={s.error}>{error}</Text>
          ) : (
            <Text testID="home-horoscope" style={[text.bodyLg, s.horoscope]}>
              {horoscope}
            </Text>
          )}
        </View>

        <View style={s.divider} />

        <View style={s.section}>
          <Text style={text.label}>Daily pull</Text>
          {loadingC ? (
            <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.lg }} />
          ) : cardMeta ? (
            <View testID="home-tarot-card" style={s.cardWrap}>
              <View style={s.glowWrap}>
                <LinearGradient
                  colors={["#4B0082", "transparent"]}
                  style={s.ambientGlow}
                />
              </View>
              <TarotCardVisual card={cardMeta} reversed={dailyCard.reversed} />
              <View style={s.cardMeta}>
                <Text style={[text.h3, { textAlign: "center" }]}>
                  {cardMeta.name}
                  {dailyCard.reversed ? " · Reversed" : ""}
                </Text>
                <Text style={[text.bodyDim, s.interpretation]}>{dailyCard.interpretation}</Text>
              </View>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          testID="home-go-tarot"
          style={s.ghostBtn}
          onPress={() => router.push("/(tabs)/tarot")}
        >
          <Text style={s.ghostBtnText}>DRAW ANOTHER CARD →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xxl },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  pill: {
    backgroundColor: colors.pink,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginTop: spacing.xs,
  },
  pillEmpty: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.error,
  },
  pillText: {
    color: colors.textInverse,
    fontFamily: fonts.bodySemibold,
    fontSize: 10,
    letterSpacing: 1,
  },
  pillTextEmpty: {
    color: colors.error,
  },
  section: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  horoscope: { lineHeight: 30, fontSize: 19 },
  cardWrap: { alignItems: "center", gap: spacing.lg, paddingVertical: spacing.md, position: "relative" },
  cardMeta: { gap: spacing.sm, paddingHorizontal: spacing.md, alignItems: "center" },
  interpretation: { textAlign: "center", lineHeight: 24, color: colors.textSecondary },
  glowWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  ambientGlow: {
    width: 280,
    height: 280,
    borderRadius: 999,
    opacity: 0.18,
  },
  error: { color: colors.error, marginTop: spacing.md, fontFamily: "Inter_500Medium" },
  ghostBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  ghostBtnText: {
    color: colors.gold,
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 2,
  },
});
