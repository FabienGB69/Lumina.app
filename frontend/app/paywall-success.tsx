import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../src/api";
import { useAuth } from "../src/auth";
import { colors, spacing, text } from "../src/theme";

export default function PaywallSuccess() {
  const params = useLocalSearchParams<{ session_id?: string }>();
  const { refresh } = useAuth();
  const [status, setStatus] = useState<"loading" | "ok" | "pending" | "error">("loading");
  const polled = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (!params.session_id) {
        setStatus("error");
        return;
      }
      try {
        const r = await api.stripeSession(params.session_id);
        if (cancelled) return;
        if (r.is_premium) {
          await refresh();
          setStatus("ok");
        } else if (polled.current < 10) {
          polled.current++;
          setTimeout(poll, 1500);
        } else {
          setStatus("pending");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    };
    void poll();
    return () => {
      cancelled = true;
    };
  }, [params.session_id, refresh]);

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <View style={s.container}>
        {status === "loading" ? (
          <>
            <ActivityIndicator size="large" color={colors.textPrimary} />
            <Text style={[text.label, { marginTop: spacing.lg }]}>VERIFYING</Text>
          </>
        ) : status === "ok" ? (
          <>
            <Text style={[text.h1, { textAlign: "center" }]}>Welcome.</Text>
            <Text style={[text.bodyDim, s.center]}>
              You&apos;re premium. The deck is yours.
            </Text>
            <TouchableOpacity
              testID="paywall-success-continue"
              style={s.btn}
              onPress={() => router.replace("/(tabs)")}
            >
              <Text style={s.btnText}>CONTINUE</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[text.h2, { textAlign: "center" }]}>
              {status === "pending" ? "Still verifying..." : "Something went sideways."}
            </Text>
            <Text style={[text.bodyDim, s.center]}>
              If your card was charged, premium will activate shortly.
            </Text>
            <TouchableOpacity style={s.btn} onPress={() => router.replace("/(tabs)")}>
              <Text style={s.btnText}>BACK</Text>
            </TouchableOpacity>
          </>
        )}
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
