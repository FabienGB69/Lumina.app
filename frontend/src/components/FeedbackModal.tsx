import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "../api";
import { useTranslation } from "../i18n";
import { colors, radii, spacing, text } from "../theme";

type Cat = "bug" | "idea" | "other";

export function FeedbackModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<Cat>("other");
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setCategory("other");
    setRating(null);
    setMessage("");
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    setError(null);
    const trimmed = message.trim();
    if (trimmed.length < 3) {
      setError(t("profile.feedbackTooShort"));
      return;
    }
    setBusy(true);
    try {
      await api.submitFeedback(trimmed, category, rating);
      Alert.alert(t("profile.thanksTitle"), t("profile.thanksBody"));
      close();
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setBusy(false);
    }
  };

  const CATS: { key: Cat; label: string }[] = [
    { key: "bug", label: t("profile.catBug") },
    { key: "idea", label: t("profile.catIdea") },
    { key: "other", label: t("profile.catOther") },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={close}>
      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            <View style={s.head}>
              <Text style={text.h3}>{t("profile.feedbackTitle")}</Text>
              <Pressable testID="feedback-close" onPress={close} hitSlop={16}>
                <Text style={[text.label, { color: colors.textPrimary }]}>
                  {t("profile.close")}
                </Text>
              </Pressable>
            </View>

            <Text style={[text.bodyDim, { fontSize: 13, marginBottom: spacing.md }]}>
              {t("profile.feedbackHint")}
            </Text>

            <Text style={text.label}>{t("profile.feedbackCategory")}</Text>
            <View style={s.row}>
              {CATS.map((c) => {
                const active = category === c.key;
                return (
                  <TouchableOpacity
                    key={c.key}
                    testID={`feedback-cat-${c.key}`}
                    onPress={() => setCategory(c.key)}
                    style={[s.chip, active && s.chipActive]}
                  >
                    <Text
                      style={[
                        s.chipText,
                        active && { color: colors.textOnGold ?? colors.bg },
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[text.label, { marginTop: spacing.lg }]}>
              {t("profile.feedbackRating")}
            </Text>
            <View style={s.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  testID={`feedback-star-${n}`}
                  onPress={() => setRating(rating === n ? null : n)}
                  style={s.star}
                  hitSlop={8}
                >
                  <Text
                    style={[
                      s.starText,
                      rating != null && n <= rating && { color: colors.gold },
                    ]}
                  >
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[text.label, { marginTop: spacing.lg }]}>
              {t("profile.feedbackMessage")}
            </Text>
            <TextInput
              testID="feedback-message"
              value={message}
              onChangeText={setMessage}
              placeholder={t("profile.feedbackPlaceholder")}
              placeholderTextColor={colors.textTertiary}
              multiline
              style={s.input}
              maxLength={2000}
            />

            {error ? (
              <Text testID="feedback-error" style={s.error}>
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              testID="feedback-submit"
              onPress={submit}
              disabled={busy}
              style={[s.submitBtn, busy && { opacity: 0.6 }]}
            >
              <Text style={s.submitText}>{busy ? t("profile.submitting") : t("profile.submit")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  row: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, flexWrap: "wrap" },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: {
    color: colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1,
  },
  starsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  star: { padding: 4 },
  starText: { fontSize: 32, color: colors.textTertiary },
  input: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    minHeight: 120,
    textAlignVertical: "top",
  },
  error: {
    color: colors.crimson,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    marginTop: spacing.sm,
  },
  submitBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    alignItems: "center",
  },
  submitText: {
    color: colors.textOnGold ?? colors.bg,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: 3,
  },
});
