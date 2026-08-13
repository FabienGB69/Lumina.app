import { LinearGradient } from "expo-linear-gradient";
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
import { LuminaLogo } from "../src/components/LuminaLogo";
import { useAuth } from "../src/auth";
import { useTranslation } from "../src/i18n";
import { colors, gradients, radii, spacing, text } from "../src/theme";

export default function Register() {
  const { t } = useTranslation();
  const { signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (password.length < 6) {
      setError(t("auth.errPasswordLen"));
      return;
    }
    if (username.length < 3) {
      setError(t("auth.errUsernameLen"));
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), username.trim(), password);
      router.replace("/onboarding");
    } catch (e: any) {
      setError(e.message || t("auth.errRegisterGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setGLoading(true);
    try {
      const u = await signInWithGoogle();
      if (u) router.replace(u.onboarded ? "/" : "/onboarding");
    } catch (e: any) {
      setError(e.message || t("auth.errGoogleGeneric"));
    } finally {
      setGLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.flex}
        >
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            <View style={s.header}>
              <LuminaLogo size={96} />
              <Text style={[text.label, s.brand]}>{t("auth.brand")}</Text>
              <Text style={[text.h1, s.title]}>{t("auth.registerTitle")}</Text>
              <Text style={[text.bodyDim, s.subtitle]}>{t("auth.registerSubtitle")}</Text>
            </View>

            <View style={s.field}>
              <Text style={text.labelMuted}>{t("auth.email")}</Text>
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
              <Text style={text.labelMuted}>{t("auth.username")}</Text>
              <TextInput
                testID="register-username-input"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholderTextColor={colors.textTertiary}
                placeholder={t("auth.usernameHint")}
                style={s.input}
              />
            </View>
            <View style={s.field}>
              <Text style={text.labelMuted}>{t("auth.password")}</Text>
              <TextInput
                testID="register-password-input"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={colors.textTertiary}
                placeholder={t("auth.passwordHint")}
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
              activeOpacity={0.85}
              onPress={onSubmit}
              disabled={loading}
              style={[s.primaryBtn, loading && { opacity: 0.6 }]}
            >
              <LinearGradient
                colors={gradients.gold}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.primaryBtnGrad}
              >
                <Text style={s.primaryBtnText}>
                  {loading ? t("auth.creating") : t("auth.create")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>{t("auth.or")}</Text>
              <View style={s.dividerLine} />
            </View>

            <TouchableOpacity
              testID="register-google-button"
              activeOpacity={0.85}
              onPress={onGoogle}
              disabled={gLoading}
              style={[s.googleBtn, gLoading && { opacity: 0.6 }]}
            >
              <Text style={s.googleG}>G</Text>
              <Text style={s.googleBtnText}>
                {gLoading ? t("auth.connecting") : t("auth.google")}
              </Text>
            </TouchableOpacity>

            <Link href="/login" asChild>
              <TouchableOpacity testID="register-to-login" style={s.linkBtn}>
                <Text style={[text.bodyDim, { textAlign: "center" }]}>
                  {t("auth.haveAccount")}{" "}
                  <Text style={{ color: colors.gold, textDecorationLine: "underline" }}>
                    {t("auth.signIn")}
                  </Text>
                </Text>
              </TouchableOpacity>
            </Link>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl, gap: spacing.lg },
  header: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  brand: { marginTop: spacing.md, letterSpacing: 8 },
  title: { marginTop: spacing.sm, textAlign: "center" },
  subtitle: { marginBottom: spacing.md, textAlign: "center" },
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
    marginTop: spacing.md,
    borderRadius: radii.pill,
    overflow: "hidden",
    shadowColor: colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryBtnGrad: {
    paddingVertical: spacing.md,
    alignItems: "center",
    borderRadius: radii.pill,
  },
  primaryBtnText: {
    color: colors.textOnGold,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: 3,
  },
  linkBtn: { paddingVertical: spacing.md },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 3,
    color: colors.textTertiary,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleG: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: colors.gold,
  },
  googleBtnText: {
    color: colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 2,
  },
});
