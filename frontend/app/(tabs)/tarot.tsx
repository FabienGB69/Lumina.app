import { router } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../src/api";
import { useAuth } from "../../src/auth";
import { useCreditsStore } from "../../src/stores/creditsStore";
import { FlippableTarotCard, TarotCardBack } from "../../src/TarotCard";
import { getCardById, useDeck } from "../../src/deck";
import { colors, spacing, text } from "../../src/theme";

const CARD_W = 220;
const CARD_H = 360;

export default function TarotScreen() {
  const { user } = useAuth();
  const deck = useDeck();
  const { decrement: decrementCredits } = useCreditsStore();
  const [question, setQuestion] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [reading, setReading] = useState<any>(null);
  const [showReading, setShowReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draw = async () => {
    setError(null);
    setDrawing(true);
    setShowReading(true);
    try {
      const r = await api.tarotDraw(question || undefined);
      setReading(r);
      decrementCredits();
    } catch (e: any) {
      setError(e.message || "Could not draw");
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
          <Text style={text.label}>TAROT</Text>
          <Text style={[text.h1, s.title]}>Draw{"\n"}a card.</Text>
          <Text style={[text.bodyDim, s.subtitle]}>
            Face it. The deck owes you nothing.
          </Text>
        </View>

        <View style={s.qWrap}>
          <Text style={text.label}>Your question (optional)</Text>
          <TextInput
            testID="tarot-question-input"
            value={question}
            onChangeText={setQuestion}
            placeholder="Why do I keep doing this?"
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
          <Text style={s.primaryBtnText}>{drawing ? "DRAWING..." : "DRAW"}</Text>
        </TouchableOpacity>

        {!user?.is_premium && (
          <Text style={[text.bodyDim, s.freeNote]}>
            Free: 1 manual draw / day. Premium: unlimited.
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
              <Text style={[text.label, { color: colors.textPrimary }]}>CLOSE ×</Text>
            </Pressable>

            <View style={s.flipWrap}>
              <FlippableTarotCard
                card={cardMeta}
                reversed={reading?.reversed}
                flipped={showReading && !drawing && !!cardMeta}
                width={CARD_W}
                height={CARD_H}
              />
            </View>

            {reading && cardMeta ? (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={s.readingScroll}>
                <Text style={[text.h2, s.readingTitle]}>
                  {cardMeta.name}
                  {reading.reversed ? " · Reversed" : ""}
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
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderRadius: 2,
  },
  primaryBtnText: {
    color: colors.textInverse,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: 2,
  },
  freeNote: { textAlign: "center", marginTop: spacing.md, fontSize: 12 },
  error: {
    color: colors.error,
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
  readingScroll: { paddingTop: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  readingTitle: { textAlign: "center" },
  readingBody: { lineHeight: 28, color: colors.textPrimary },
});
