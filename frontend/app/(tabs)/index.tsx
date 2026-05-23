import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
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

// ---------------------------------------------------------------------------
// Shimmer placeholder — animated gold/pink sweep for loading states
// ---------------------------------------------------------------------------
function ShimmerPlaceholder({ width = 280, height = 80 }: { width?: number; height?: number }) {
  const translateX = useSharedValue(-width);

  useEffect(() => {
    translateX.value = -width;
    translateX.value = withRepeat(
      withTiming(width * 1.5, { duration: 1100 }),
      -1,
      true,
    );
  }, [width, translateX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[{ width, height, borderRadius: 6, overflow: "hidden", backgroundColor: colors.surface }]}>
      <Animated.View style={[{ position: "absolute", top: 0, width: width * 0.6, height }, shimmerStyle]}>
        <LinearGradient
          colors={[
            "transparent",
            `rgba(212,175,55,0.15)`,
            `rgba(232,180,200,0.10)`,
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// CreditPill — animated scale pulse when credits change
// ---------------------------------------------------------------------------
function CreditPill() {
  const { credits, isPremium, fetch } = useCreditsStore();
  const pillScale = useSharedValue(1);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  useEffect(() => {
    if (credits !== null) {
      pillScale.value = withSequence(
        withSpring(1.12, { damping: 10 }),
        withSpring(1, { damping: 12 }),
      );
    }
  }, [credits, pillScale]);

  const pillAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillScale.value }],
  }));

  if (isPremium) return null;
  if (credits === null) return null;

  const isEmpty = credits === 0;

  return (
    <Animated.View style={pillAnimStyle}>
      <TouchableOpacity
        style={[s.pill, isEmpty && s.pillEmpty]}
        onPress={() => router.push("/subscription")}
        activeOpacity={0.8}
      >
        <Text style={[s.pillText, isEmpty && s.pillTextEmpty]}>
          {isEmpty ? "NO CREDITS · UPGRADE" : `✦ ${credits} CREDIT${credits === 1 ? "" : "S"}`}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Animated section factory — shared translateY + opacity entry
// ---------------------------------------------------------------------------
function useEntryAnim(delayMs: number) {
  const translateY = useSharedValue(28);
  const opacity = useSharedValue(0);

  const trigger = useCallback(() => {
    translateY.value = withDelay(delayMs, withSpring(0, { damping: 20, stiffness: 100 }));
    opacity.value = withDelay(delayMs, withTiming(1, { duration: 350 }));
  }, [delayMs, translateY, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return { style, trigger };
}

// ---------------------------------------------------------------------------
// Today screen
// ---------------------------------------------------------------------------
export default function Today() {
  const { user } = useAuth();
  const deck = useDeck();
  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [dailyCard, setDailyCard] = useState<any>(null);
  const [loadingH, setLoadingH] = useState(true);
  const [loadingC, setLoadingC] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [btnPressed, setBtnPressed] = useState(false);

  const { fetch: fetchCredits } = useCreditsStore();

  // Staggered entry animations
  const header = useEntryAnim(0);
  const horoscopeSection = useEntryAnim(120);
  const cardSection = useEntryAnim(260);
  const ctaSection = useEntryAnim(380);

  // Button glow on press
  const btnGlowOpacity = useSharedValue(0);
  const btnGlowStyle = useAnimatedStyle(() => ({
    shadowColor: colors.gold,
    shadowOpacity: btnGlowOpacity.value,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  }));

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
    // Trigger all staggered entries on mount
    header.trigger();
    horoscopeSection.trigger();
    cardSection.trigger();
    ctaSection.trigger();
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
        {/* Header */}
        <Animated.View style={[s.header, header.style]}>
          <View style={s.headerRow}>
            <View>
              <Text style={text.label}>{todayLabel()}</Text>
              <Text style={[text.h2, { marginTop: spacing.xs }]}>Hi, {user?.username}.</Text>
            </View>
            <CreditPill />
          </View>
        </Animated.View>

        {/* Horoscope section */}
        <Animated.View style={[s.section, horoscopeSection.style]}>
          <Text style={text.label}>Today&apos;s horoscope</Text>
          {loadingH ? (
            <View style={{ marginTop: spacing.lg }}>
              <ShimmerPlaceholder height={22} />
              <View style={{ height: spacing.sm }} />
              <ShimmerPlaceholder height={22} width={220} />
              <View style={{ height: spacing.sm }} />
              <ShimmerPlaceholder height={22} width={180} />
            </View>
          ) : error && !horoscope ? (
            <Text style={s.error}>{error}</Text>
          ) : (
            <Text testID="home-horoscope" style={[text.bodyLg, s.horoscope]}>
              {horoscope}
            </Text>
          )}
        </Animated.View>

        <View style={s.divider} />

        {/* Daily card section */}
        <Animated.View style={[s.section, cardSection.style]}>
          <Text style={text.label}>Daily pull</Text>
          {loadingC ? (
            <View style={[s.cardWrap, { gap: spacing.md }]}>
              <ShimmerPlaceholder width={220} height={360} />
            </View>
          ) : cardMeta ? (
            <View testID="home-tarot-card" style={s.cardWrap}>
              {/* Layered ambient glow — more dramatic double gradient */}
              <View style={s.glowWrap} pointerEvents="none">
                <LinearGradient
                  colors={["rgba(75,0,130,0.12)", "transparent"]}
                  style={s.ambientGlowOuter}
                />
                <LinearGradient
                  colors={["rgba(107,45,140,0.18)", "transparent"]}
                  style={s.ambientGlowInner}
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
        </Animated.View>

        {/* CTA button with glow on press */}
        <Animated.View style={[ctaSection.style, btnGlowStyle]}>
          <Pressable
            testID="home-go-tarot"
            style={s.ghostBtn}
            onPress={() => router.push("/(tabs)/tarot")}
            onPressIn={() => {
              btnGlowOpacity.value = withTiming(0.3, { duration: 120 });
            }}
            onPressOut={() => {
              btnGlowOpacity.value = withTiming(0, { duration: 200 });
            }}
          >
            <Text style={s.ghostBtnText}>DRAW ANOTHER CARD →</Text>
          </Pressable>
        </Animated.View>
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
  cardWrap: {
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing.xl,
    position: "relative",
  },
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
  },
  ambientGlowOuter: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 999,
  },
  ambientGlowInner: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 999,
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
