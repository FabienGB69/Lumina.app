import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../src/api";
import { useAuth } from "../../src/auth";
import { useTranslation } from "../../src/i18n";
import { TarotCardBack, TarotCardVisual } from "../../src/TarotCard";
import { getCardById, useDeck } from "../../src/deck";
import { colors, spacing, text } from "../../src/theme";

const CARD_W = 220;
const CARD_H = 360;

export default function TarotScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const deck = useDeck();
  const [question, setQuestion] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [reading, setReading] = useState<any>(null);
  const [showReading, setShowReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rotation = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(rotation.value, [0, 180], [180, 360])}deg` },
    ],
    opacity: rotation.value > 90 ? 1 : 0,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotation.value}deg` }],
    opacity: rotation.value > 90 ? 0 : 1,
  }));

  useEffect(() => {
    if (!showReading) rotation.value = 0;
  }, [showReading, rotation]);

  const draw = async () => {
    setError(null);
    setDrawing(true);
    setShowReading(true);
    try {
      const r = await api.tarotDraw(question || undefined);
      setReading(r);
      // start flip after slight delay so back is visible
      setTimeout(() => {
        rotation.value = withTiming(180, {
          duration: 700,
          easing: Easing.inOut(Easing.ease),
        });
      }, 600);
    } catch (e: any) {
      setError(e.message || t("tarot.errDraw"));
      if (e.status === 402) {
        setShowReading(false);
        router.push("/paywall");
      }
    } finally {
      setDrawing(false);
    }
  };

  const cardMeta = reading ? getCardById(deck, reading.card_id) : null;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <Text style={text.label}>{t("tarot.label")}</Text>
          <Text style={[text.h1, s.title]}>{t("tarot.title")}</Text>
          <Text style={[text.bodyDim, s.subtitle]}>{t("tarot.subtitle")}</Text>
        </View>

        <View style={s.qWrap}>
          <Text style={text.label}>{t("tarot.questionLabel")}</Text>
          <TextInput
            testID="tarot-question-input"
            value={question}
            onChangeText={setQuestion}
            placeholder={t("tarot.questionPlaceholder")}
            placeholderTextColor={colors.textTertiary}
            style={s.input}
            multiline
          />
        </View>

        <View style={s.deckPreview}>
          <TarotCardBack width={CARD_W} height={CARD_H} />
        </View>

        <TouchableOpacity
          testID="tarot-draw-button"
          style={[s.primaryBtn, drawing && { opacity: 0.6 }]}
          onPress={draw}
          disabled={drawing}
        >
          <Text style={s.primaryBtnText}>{drawing ? t("tarot.drawing") : t("tarot.draw")}</Text>
        </TouchableOpacity>

        {!user?.is_premium && (
          <Text style={[text.bodyDim, s.freeNote]}>
            {t("tarot.freeNote")}
          </Text>
        )}

        {error ? (
          <Text testID="tarot-error" style={s.error}>
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <Modal
        visible={showReading}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setShowReading(false)}
      >
        <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
          <View style={s.modalContent}>
            <Pressable
              testID="tarot-reading-close"
              hitSlop={16}
              onPress={() => setShowReading(false)}
              style={s.closeBtn}
            >
              <Text style={[text.label, { color: colors.textPrimary }]}>{t("tarot.close")}</Text>
            </Pressable>

            <View style={s.flipWrap}>
              <Animated.View style={[s.absolute, backStyle]}>
                <TarotCardBack width={CARD_W} height={CARD_H} />
              </Animated.View>
              {cardMeta && (
                <Animated.View style={[s.absolute, frontStyle]}>
                  <TarotCardVisual
                    card={cardMeta}
                    reversed={reading?.reversed}
                    width={CARD_W}
                    height={CARD_H}
                  />
                </Animated.View>
              )}
              {!cardMeta && drawing ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : null}
            </View>

            {reading && cardMeta ? (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={s.readingScroll}>
                <Text style={[text.h2, s.readingTitle]}>
                  {cardMeta.name}
                  {reading.reversed ? t("home.reversedSuffix") : ""}
                </Text>
                <Text testID="tarot-reading-text" style={[text.bodyLg, s.readingBody]}>
                  {reading.interpretation}
                </Text>
              </ScrollView>
            ) : null}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xxl },
  header: { padding: spacing.lg, gap: spacing.sm },
  title: { marginTop: spacing.xs },
  subtitle: { marginBottom: 0 },
  qWrap: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.lg },
  input: {
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 17,
    fontFamily: "Inter_400Regular",
    minHeight: 48,
  },
  deckPreview: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
  },
  primaryBtn: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.textPrimary,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  primaryBtnText: {
    color: colors.textInverse,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: 2,
  },
  freeNote: { textAlign: "center", marginTop: spacing.md, fontSize: 12 },
  error: {
    color: colors.crimson,
    marginTop: spacing.md,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  modalContent: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  closeBtn: { alignSelf: "flex-end", padding: spacing.sm },
  flipWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: CARD_W,
    height: CARD_H,
    alignSelf: "center",
    marginVertical: spacing.lg,
  },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
  },
  readingScroll: { paddingTop: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  readingTitle: { textAlign: "center" },
  readingBody: { lineHeight: 28, color: colors.textPrimary },
});
