import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ApplePayButton,
  isPlatformPaySupported,
  PlatformPay,
  PlatformPayButton,
  useStripe,
} from "@stripe/stripe-react-native";
import { colors, fonts, spacing } from "../theme";

type Props = {
  /** Called with the Stripe payment method ID on success. */
  onSuccess: (paymentMethodId?: string) => void;
  onError: (message: string) => void;
  /** Label shown in the Apple Pay sheet. */
  label?: string;
  /** Amount in cents. */
  amount?: number;
  /** ISO-4217 currency, e.g. "eur". */
  currency?: string;
};

export function PaymentSheet({
  onSuccess,
  onError,
  label = "Lumina Premium",
  amount = 999,
  currency = "eur",
}: Props) {
  const { confirmPlatformPayPayment, createPaymentMethod } = useStripe();
  const [applePayLoading, setApplePayLoading] = useState(false);
  const isIOS = Platform.OS === "ios";

  const handleApplePay = async () => {
    if (!isIOS) return;
    setApplePayLoading(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const supported = await isPlatformPaySupported();
      if (!supported) {
        onError("Apple Pay is not available on this device.");
        return;
      }

      const { paymentMethod, error } = await createPaymentMethod({
        paymentMethodType: "Card",
        paymentMethodData: {
          billingDetails: {},
        },
      });

      // In a real integration, pass clientSecret from your backend
      // and call confirmPlatformPayPayment(clientSecret, { applePay: { ... } })
      // For now we surface the paymentMethod ID to the parent for server-side confirmation.
      if (error) {
        onError(error.message);
        return;
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess(paymentMethod?.id);
    } catch (e: any) {
      onError(e?.message ?? "Apple Pay failed");
    } finally {
      setApplePayLoading(false);
    }
  };

  return (
    <View style={s.container}>
      {isIOS && (
        <Pressable
          testID="apple-pay-button"
          style={({ pressed }) => [s.appleBtn, pressed && s.appleBtnPressed]}
          onPress={handleApplePay}
          disabled={applePayLoading}
        >
          {applePayLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={s.appleBtnInner}>
              {/* Apple logo via unicode — replaced by the real ApplePayButton in prod */}
              <Text style={s.appleIcon}></Text>
              <Text style={s.appleBtnText}>Pay with Apple Pay</Text>
            </View>
          )}
        </Pressable>
      )}

      {isIOS && <DividerRow />}
    </View>
  );
}

function DividerRow() {
  return (
    <View style={s.dividerRow}>
      <View style={s.dividerLine} />
      <Text style={s.dividerText}>OR PAY WITH CARD</Text>
      <View style={s.dividerLine} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: spacing.md },
  appleBtn: {
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  appleBtnPressed: { opacity: 0.75 },
  appleBtnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  appleIcon: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: fonts.heading,
    lineHeight: 22,
  },
  appleBtnText: {
    color: "#FFFFFF",
    fontFamily: fonts.bodySemibold,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    color: colors.textTertiary,
    fontFamily: fonts.bodySemibold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
});
