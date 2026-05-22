import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/auth";
import { colors, spacing, text } from "../src/theme";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/");
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.flex}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={text.label}>ECHO</Text>
          <Text style={[text.h1, s.title]}>Welcome{"\n"}back.</Text>
          <Text style={[text.bodyDim, s.subtitle]}>
            The universe noticed your absence.
          </Text>

          <View style={s.field}>
            <Text style={text.label}>Email</Text>
            <TextInput
              testID="login-email-input"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholderTextColor={colors.textTertiary}
              placeholder="you@somewhere.com"
              style={s.input}
            />
          </View>
          <View style={s.field}>
            <Text style={text.label}>Password</Text>
            <TextInput
              testID="login-password-input"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={colors.textTertiary}
              placeholder="••••••••"
              style={s.input}
            />
          </View>

          {error ? (
            <Text testID="login-error" style={s.error}>
              {error}
            </Text>
          ) : null}

          <TouchableOpacity
            testID="login-submit-button"
            style={[s.primaryBtn, loading && { opacity: 0.6 }]}
            onPress={onSubmit}
            disabled={loading}
          >
            <Text style={s.primaryBtnText}>{loading ? "ENTERING..." : "ENTER"}</Text>
          </TouchableOpacity>

          <Link href="/register" asChild>
            <TouchableOpacity testID="login-to-register" style={s.linkBtn}>
              <Text style={[text.bodyDim, { textAlign: "center" }]}>
                No account?{" "}
                <Text style={{ color: colors.textPrimary, textDecorationLine: "underline" }}>
                  Make one
                </Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl, gap: spacing.lg },
  title: { marginTop: spacing.sm },
  subtitle: { marginBottom: spacing.xl },
  field: { gap: spacing.sm },
  input: {
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: "Inter_400Regular",
  },
  error: {
    color: colors.crimson,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  primaryBtn: {
    backgroundColor: colors.textPrimary,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  primaryBtnText: {
    color: colors.textInverse,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: 2,
  },
  linkBtn: { paddingVertical: spacing.md },
});
