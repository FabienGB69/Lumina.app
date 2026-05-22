import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, spacing } from "./theme";

export type TarotCardData = {
  id: string;
  name: string;
  arcana: "major" | "minor";
  number?: number;
  rank?: string;
  suit?: string;
  keywords_upright: string[];
  keywords_reversed: string[];
};

type Props = {
  card: TarotCardData;
  reversed?: boolean;
  width?: number;
  height?: number;
  showKeywords?: boolean;
};

export function TarotCardVisual({
  card,
  reversed,
  width = 220,
  height = 360,
  showKeywords = true,
}: Props) {
  const ratio = height / 360;
  const num =
    card.arcana === "major" && card.number !== undefined
      ? card.number.toString().padStart(2, "0")
      : card.rank?.slice(0, 1).toUpperCase();
  const suit = card.suit
    ? card.suit.charAt(0).toUpperCase() + card.suit.slice(1)
    : "MAJOR";

  return (
    <View
      style={[
        s.card,
        { width, height, transform: [{ rotate: reversed ? "180deg" : "0deg" }] },
      ]}
    >
      <View style={s.inner}>
        <View style={s.top}>
          <Text style={[s.suit, { fontSize: 10 * ratio }]}>
            {card.arcana === "major" ? "MAJOR ARCANA" : suit.toUpperCase()}
          </Text>
          <Text style={[s.num, { fontSize: 12 * ratio }]}>{num}</Text>
        </View>

        <View style={s.center}>
          <View style={[s.symbol, { width: 80 * ratio, height: 80 * ratio }]}>
            <View
              style={[s.symbolInner, { width: 60 * ratio, height: 60 * ratio }]}
            />
          </View>
        </View>

        <View style={s.bottom}>
          <Text
            style={[s.name, { fontSize: 22 * ratio, lineHeight: 24 * ratio }]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {card.name}
          </Text>
          {showKeywords ? (
            <Text style={[s.keywords, { fontSize: 9 * ratio }]} numberOfLines={1}>
              {(reversed ? card.keywords_reversed : card.keywords_upright)
                .slice(0, 3)
                .join(" · ")
                .toUpperCase()}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function TarotCardBack({ width = 220, height = 360 }: { width?: number; height?: number }) {
  return (
    <View style={[s.card, { width, height }]}>
      <View style={s.inner}>
        <View style={s.backCenter}>
          <Text style={s.backEcho}>E</Text>
          <View style={s.backLine} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.textPrimary,
    borderRadius: 4,
  },
  inner: { flex: 1, padding: spacing.md, justifyContent: "space-between" },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  suit: {
    color: colors.textSecondary,
    fontFamily: fonts.bodySemibold,
    letterSpacing: 2,
  },
  num: {
    color: colors.textPrimary,
    fontFamily: fonts.bodySemibold,
    letterSpacing: 2,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  symbol: {
    borderWidth: 1,
    borderColor: colors.textPrimary,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  symbolInner: {
    borderWidth: 1,
    borderColor: colors.textPrimary,
    transform: [{ rotate: "45deg" }],
  },
  bottom: { alignItems: "center", gap: 4 },
  name: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    textAlign: "center",
  },
  keywords: {
    color: colors.textTertiary,
    fontFamily: fonts.body,
    letterSpacing: 1.5,
  },
  backCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  backEcho: {
    color: colors.textPrimary,
    fontFamily: fonts.headingLight,
    fontSize: 72,
    letterSpacing: -2,
  },
  backLine: {
    width: 60,
    height: 1,
    backgroundColor: colors.textPrimary,
  },
});
