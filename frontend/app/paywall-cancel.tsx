import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../src/i18n";
import { colors, spacing, text } from "../src/theme";

export default function PaywallCancel() {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <View style={s.container}>
        <Text style={text.label}>{t("paywall.canceledLabel")}</Text>
        <Text style={[text.h2, { textAlign: "center" }]}>{t("paywall.canceledTitle")}</Text>
        <Text style={[text.bodyDim, s.center]}>{t("paywall.canceledBody")}</Text>
        <TouchableOpacity
          testID="paywall-cancel-back"
          style={s.btn}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={s.btnText}>{t("paywall.ok")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.lg },
  center: { textAlign: "center" },
  btn: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  btnText: { color: colors.textInverse, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
});
