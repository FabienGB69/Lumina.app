import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { PlanKey, usePayment } from "../payments/PaymentProvider";
import { colors, fonts } from "../theme";

type Props = {
  plan: PlanKey;
  /** Primary label shown on the Stripe card button */
  label: string;
  style?: ViewStyle;
  onSuccess?: () => void;
  onError?: (msg: string) => void;
};

export function PaymentButton({ plan, label, style, onSuccess, onError }: Props) {
  const { purchase, purchaseApplePay, loading, error, applePayAvailable } = usePayment();

  const handleCard = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await purchase(plan);
      onSuccess?.();
    } catch (e: any) {
      onError?.(e?.message ?? "Payment failed");
    }
  };

  const handleApplePay = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await purchaseApplePay(plan);
      onSuccess?.();
    } catch (e: any) {
      onError?.(e?.message ?? "Apple Pay failed");
    }
  };

  return (
    <View style={[s.wrap, style]}>
      {/* Apple Pay — iOS only, when available */}
      {Platform.OS === "ios" && applePayAvailable && (
        <Pressable
          style={({ pressed }) => [s.appleBtn, pressed && { opacity: 0.85 }]}
          onPress={handleApplePay}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.appleBtnText}> Pay</Text>
          )}
        </Pressable>
      )}

      {/* Divider when both buttons are shown */}
      {Platform.OS === "ios" && applePayAvailable && (
        <View style={s.dividerRow}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>OR</Text>
          <View style={s.dividerLine} />
        </View>
      )}

      {/* Stripe card button */}
      <Pressable
        style={({ pressed }) => [s.cardBtn, pressed && { opacity: 0.85 }, loading && { opacity: 0.6 }]}
        onPress={handleCard}
        disabled={loading}
      >
        <LinearGradient
          colors={[colors.gold, colors.goldLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.cardBtnGradient}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={s.cardBtnText}>{label}</Text>
          )}
        </LinearGradient>
      </Pressable>

      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 12 },
  appleBtn: {
    backgroundColor: "#000",
    height: 52,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  appleBtnText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: fonts.bodySemibold,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    color: colors.textTertiary,
    fontFamily: fonts.bodySemibold,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  cardBtn: { borderRadius: 4, overflow: "hidden" },
  cardBtnGradient: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBtnText: {
    color: colors.textInverse,
    fontFamily: fonts.bodySemibold,
    fontSize: 14,
    letterSpacing: 2,
  },
  error: {
    color: colors.error,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    textAlign: "center",
  },
});
