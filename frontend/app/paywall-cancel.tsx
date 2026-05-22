import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, text } from "../src/theme";

export default function PaywallCancel() {
  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <View style={s.container}>
        <Text style={text.label}>CANCELED</Text>
        <Text style={[text.h2, { textAlign: "center" }]}>You backed out.</Text>
        <Text style={[text.bodyDim, s.center]}>The stars noticed. Try again whenever.</Text>
        <TouchableOpacity
          testID="paywall-cancel-back"
          style={s.btn}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={s.btnText}>OK</Text>
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
