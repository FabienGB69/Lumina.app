import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../src/api";
import { useAuth } from "../src/auth";
import { PaymentSheet } from "../src/components/PaymentSheet";
import { colors, spacing, text } from "../src/theme";

const BENEFITS = [
  { t: "Unlimited tarot draws", d: "No daily cap. Pull until you find the truth." },
  { t: "Deeper interpretations", d: "Readings that don't soften the edges." },
  { t: "Compatibility deep-dives", d: "See every friction point. Not just the score." },
  { t: "Priority for new readings", d: "Future spreads land in your deck first." },
];

export default function Paywall() {
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubscribe = async () => {
    setError(null);
    setLoading(true);
    try {
      const { url, session_id } = await api.stripeCheckout();
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          window.location.href = url;
        }
      } else {
        await WebBrowser.openBrowserAsync(url).catch(async () => {
          await Linking.openURL(url);
        });
        // After returning, poll Stripe to check status
        setPolling(true);
        let attempts = 0;
        while (attempts < 20) {
          attempts++;
          await new Promise((r) => setTimeout(r, 1500));
          try {
            const r = await api.stripeSession(session_id);
            if (r.is_premium) {
              await refresh();
              setPolling(false);
              router.replace("/(tabs)/profile");
              return;
            }
          } catch {
            // ignore intermediate errors
          }
        }
        setPolling(false);
      }
    } catch (e: any) {
      setError(e.message || "Could not start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Pressable testID="paywall-close" style={s.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={colors.textPrimary} />
        </Pressable>

        <Text style={text.label}>LUMINA PREMIUM</Text>
        <Text style={[text.h1, s.title]}>Truth{"\n"}costs.</Text>
        <Text style={[text.bodyDim, s.subtitle]}>
          Unlock the deck. Lose the limits. Let the planets actually pull their weight.
        </Text>

        <View style={s.benefits}>
          {BENEFITS.map((b, i) => (
            <View key={i} style={s.benefit}>
              <Text style={[text.label, { color: colors.gold }]}>0{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[text.bodyLg, { fontFamily: "Inter_600SemiBold" }]}>{b.t}</Text>
                <Text style={[text.bodyDim, { marginTop: 2 }]}>{b.d}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={s.priceWrap}>
          <Text style={s.price}>$4.99</Text>
          <Text style={[text.label, { color: colors.textSecondary }]}>PER MONTH · CANCEL ANYTIME</Text>
        </View>

        {error ? (
          <Text testID="paywall-error" style={s.error}>
            {error}
          </Text>
        ) : null}

        <PaymentSheet
          label="Lumina Premium"
          amount={999}
          currency="eur"
          onSuccess={() => {
            // Apple Pay path: show success state, trigger Stripe session polling
            setError(null);
          }}
          onError={(msg) => setError(msg)}
        />

        <TouchableOpacity
          testID="paywall-subscribe"
          style={[s.unlockBtn, (loading || polling) && { opacity: 0.6 }]}
          onPress={onSubscribe}
          disabled={loading || polling}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={s.unlockBtnText}>{polling ? "VERIFYING..." : "PAY WITH CARD"}</Text>
          )}
        </TouchableOpacity>

        <Text style={s.fine}>
          You will be redirected to Stripe. Test mode in preview. Cancel anytime from settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingTop: spacing.md, gap: spacing.lg },
  closeBtn: { alignSelf: "flex-end" },
  title: { marginTop: spacing.sm },
  subtitle: { fontSize: 16, lineHeight: 24 },
  benefits: { gap: spacing.lg, marginTop: spacing.lg },
  benefit: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  priceWrap: {
    marginTop: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  price: {
    fontFamily: "CormorantGaramond_300Light",
    fontSize: 64,
    color: colors.textPrimary,
    letterSpacing: -1.5,
  },
  error: { color: colors.error, fontFamily: "Inter_500Medium", textAlign: "center" },
  unlockBtn: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  unlockBtnText: {
    color: colors.textInverse,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: 2,
  },
  fine: { color: colors.textTertiary, fontSize: 11, textAlign: "center" },
});
