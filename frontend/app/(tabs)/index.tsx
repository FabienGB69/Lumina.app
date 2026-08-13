import { router } from "expo-router";
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
import { useTranslation } from "../../src/i18n";
import { TarotCardVisual } from "../../src/TarotCard";
import { getCardById, useDeck } from "../../src/deck";
import { colors, spacing, text } from "../../src/theme";

function todayLabel(lang: string) {
  const d = new Date();
  const locale = lang === "fr" ? "fr-FR" : "en-US";
  return d
    .toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" })
    .toUpperCase();
}

export default function Today() {
  const { t, lang } = useTranslation();
  const { user } = useAuth();
  const deck = useDeck();
  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [dailyCard, setDailyCard] = useState<any>(null);
  const [loadingH, setLoadingH] = useState(true);
  const [loadingC, setLoadingC] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
    await load();
    setRefreshing(false);
  };

  const cardMeta = dailyCard ? getCardById(deck, dailyCard.card_id) : null;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textPrimary} />
        }
      >
        <View style={s.header}>
          <Text style={text.label}>{todayLabel(lang)}</Text>
          <Text style={[text.h2, { marginTop: spacing.xs }]}>
            {t("home.hi", { name: user?.username || "" })}
          </Text>
        </View>

        <View style={s.section}>
          <Text style={text.label}>{t("home.todaysHoroscope")}</Text>
          {loadingH ? (
            <ActivityIndicator color={colors.textPrimary} style={{ marginTop: spacing.lg }} />
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
          <Text style={text.label}>{t("home.dailyPull")}</Text>
          {loadingC ? (
            <ActivityIndicator color={colors.textPrimary} style={{ marginTop: spacing.lg }} />
          ) : cardMeta ? (
            <View testID="home-tarot-card" style={s.cardWrap}>
              <TarotCardVisual card={cardMeta} reversed={dailyCard.reversed} />
              <View style={s.cardMeta}>
                <Text style={[text.h3, { textAlign: "center" }]}>
                  {cardMeta.name}
                  {dailyCard.reversed ? t("home.reversedSuffix") : ""}
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
          <Text style={s.ghostBtnText}>{t("home.drawAnother")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xxl },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  section: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  horoscope: { lineHeight: 30, fontSize: 19 },
  cardWrap: { alignItems: "center", gap: spacing.lg, paddingVertical: spacing.md },
  cardMeta: { gap: spacing.sm, paddingHorizontal: spacing.md, alignItems: "center" },
  interpretation: { textAlign: "center", lineHeight: 24, color: colors.textSecondary },
  error: { color: colors.crimson, marginTop: spacing.md, fontFamily: "Inter_500Medium" },
  ghostBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  ghostBtnText: {
    color: colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 2,
  },
});
