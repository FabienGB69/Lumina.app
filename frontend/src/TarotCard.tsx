import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
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

// ---------------------------------------------------------------------------
// Card face — premium front
// ---------------------------------------------------------------------------
type VisualProps = {
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
}: VisualProps) {
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
        s.cardShell,
        { width, height, transform: [{ rotate: reversed ? "180deg" : "0deg" }] },
      ]}
    >
      <LinearGradient
        colors={["#0A0A0A", "#0F0A18"]}
        style={[s.cardGradient, { borderRadius: 8 }]}
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
              <View style={[s.symbolInner, { width: 56 * ratio, height: 56 * ratio }]} />
              <View style={s.symbolDot} />
            </View>
          </View>

          <View style={s.bottom}>
            <Text
              style={[s.name, { fontSize: 24 * ratio, lineHeight: 26 * ratio }]}
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
      </LinearGradient>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Card back — premium gradient + gold L monogram
// ---------------------------------------------------------------------------
export function TarotCardBack({
  width = 220,
  height = 360,
}: {
  width?: number;
  height?: number;
}) {
  return (
    <View style={[s.cardShell, { width, height }]}>
      <LinearGradient
        colors={["#0A0A0A", "#1A0A2A", "#4B0082"]}
        style={[s.cardGradient, { borderRadius: 8 }]}
      >
        <View style={s.inner}>
          <View style={s.backCenter}>
            <Text style={s.backMonogram}>L</Text>
            <View style={s.backLine} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Gold shimmer overlay — sweeps once on flip
// ---------------------------------------------------------------------------
function GoldShimmer({ width, height, visible }: { width: number; height: number; visible: boolean }) {
  const translateX = useSharedValue(-width);

  useEffect(() => {
    if (visible) {
      translateX.value = -width;
      translateX.value = withTiming(width * 1.5, { duration: 600, easing: Easing.out(Easing.ease) });
    }
  }, [visible, width, translateX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: "absolute", top: 0, left: 0, width, height, borderRadius: 8, overflow: "hidden" },
      ]}
    >
      <Animated.View style={[{ position: "absolute", top: 0, width: width * 0.5, height }, shimmerStyle]}>
        <LinearGradient
          colors={["transparent", "rgba(212,175,55,0.45)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// FlippableTarotCard — spring flip + shimmer + haptics
// ---------------------------------------------------------------------------
type FlippableProps = {
  card: TarotCardData | null;
  reversed?: boolean;
  width?: number;
  height?: number;
  /** Controls flip state from outside */
  isFlipped: boolean;
  /** Called when the user taps the card (toggle) */
  onFlip?: () => void;
};

export function FlippableTarotCard({
  card,
  reversed,
  width = 220,
  height = 360,
  isFlipped,
  onFlip,
}: FlippableProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const shimmerVisible = useSharedValue(false);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(rotation.value, [0, 180], [180, 360])}deg` },
      { scale: scale.value },
    ],
    opacity: rotation.value > 90 ? 1 : 0,
    backfaceVisibility: "hidden",
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: rotation.value > 90 ? 0 : 1,
    backfaceVisibility: "hidden",
  }));

  useEffect(() => {
    const target = isFlipped ? 180 : 0;

    // Quick scale-down at midpoint for a "pinch" feel
    scale.value = withSequence(
      withSpring(0.96, { damping: 12, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 120 }),
    );

    rotation.value = withSpring(target, {
      damping: 18,
      stiffness: 90,
      mass: 0.9,
      overshootClamping: false,
    });

    if (isFlipped) {
      shimmerVisible.value = true;
      // Reset after sweep completes
      const t = setTimeout(() => { shimmerVisible.value = false; }, 700);
      return () => clearTimeout(t);
    }
  }, [isFlipped, rotation, scale, shimmerVisible]);

  const [shimmerOn, setShimmerOn] = React.useState(false);
  useEffect(() => {
    if (isFlipped) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setShimmerOn(true);
      const t = setTimeout(() => setShimmerOn(false), 750);
      return () => clearTimeout(t);
    } else {
      setShimmerOn(false);
    }
  }, [isFlipped]);

  return (
    <View style={{ width, height }}>
      {/* Back */}
      <Animated.View style={[s.flipAbsolute, backStyle]}>
        <TarotCardBack width={width} height={height} />
        <GoldShimmer width={width} height={height} visible={shimmerOn} />
      </Animated.View>

      {/* Front */}
      {card && (
        <Animated.View style={[s.flipAbsolute, frontStyle]}>
          <TarotCardVisual card={card} reversed={reversed} width={width} height={height} />
          {/* Powder pink glow / reflection at bottom */}
          <View
            pointerEvents="none"
            style={[
              s.pinkReflect,
              { width, height: height * 0.25, bottom: 0, borderRadius: 8 },
            ]}
          />
          <GoldShimmer width={width} height={height} visible={shimmerOn} />
        </Animated.View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  cardShell: {
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderRadius: 8,
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 14,
    overflow: "hidden",
  },
  cardGradient: { flex: 1 },
  inner: { flex: 1, padding: spacing.md, justifyContent: "space-between" },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  suit: {
    color: colors.textSecondary,
    fontFamily: fonts.bodySemibold,
    letterSpacing: 2,
  },
  num: {
    color: colors.gold,
    fontFamily: fonts.bodySemibold,
    letterSpacing: 2,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  symbol: {
    borderWidth: 1,
    borderColor: colors.purpleLight,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  symbolInner: {
    borderWidth: 1,
    borderColor: colors.purpleLight,
    transform: [{ rotate: "45deg" }],
    position: "absolute",
  },
  symbolDot: {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.gold,
  },
  bottom: { alignItems: "center", gap: 6 },
  name: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    textAlign: "center",
  },
  keywords: {
    color: colors.pink,
    fontFamily: fonts.body,
    letterSpacing: 1.5,
  },
  backCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  backMonogram: {
    color: colors.gold,
    fontFamily: fonts.headingLight,
    fontSize: 88,
    letterSpacing: -2,
  },
  backLine: {
    width: 48,
    height: 1,
    backgroundColor: colors.gold,
    opacity: 0.65,
  },
  flipAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pinkReflect: {
    position: "absolute",
    left: 0,
    backgroundColor: colors.pink,
    opacity: 0.04,
  },
});
