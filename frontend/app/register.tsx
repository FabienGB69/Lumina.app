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

export default function Register() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (password.length < 6) {
      setError("Password must be 6+ characters.");
      return;
    }
    if (username.length < 3) {
      setError("Username must be 3+ characters.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), username.trim(), password);
      router.replace("/onboarding");
    } catch (e: any) {
      setError(e.message || "Registration failed");
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
          <Text style={text.label}>LUMINA</Text>
          <Text style={[text.h1, s.title]}>Arrive.</Text>
          <Text style={[text.bodyDim, s.subtitle]}>
            The stars require a witness. Be one.
          </Text>

          <View style={s.field}>
            <Text style={text.label}>Email</Text>
            <TextInput
              testID="register-email-input"
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
            <Text style={text.label}>Username</Text>
            <TextInput
              testID="register-username-input"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholderTextColor={colors.textTertiary}
              placeholder="What friends will find you by"
              style={s.input}
            />
          </View>
          <View style={s.field}>
            <Text style={text.label}>Password</Text>
            <TextInput
              testID="register-password-input"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={colors.textTertiary}
              placeholder="6+ characters"
              style={s.input}
            />
          </View>

          {error ? (
            <Text testID="register-error" style={s.error}>
              {error}
            </Text>
          ) : null}

          <TouchableOpacity
            testID="register-submit-button"
            style={[s.primaryBtn, loading && { opacity: 0.6 }]}
            onPress={onSubmit}
            disabled={loading}
          >
            <Text style={s.primaryBtnText}>{loading ? "CREATING..." : "CREATE ACCOUNT"}</Text>
          </TouchableOpacity>

          <Link href="/login" asChild>
            <TouchableOpacity testID="register-to-login" style={s.linkBtn}>
              <Text style={[text.bodyDim, { textAlign: "center" }]}>
                Already exist?{" "}
                <Text style={{ color: colors.textPrimary, textDecorationLine: "underline" }}>
                  Sign in
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
  error: { color: colors.crimson, fontFamily: "Inter_500Medium", fontSize: 13 },
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
