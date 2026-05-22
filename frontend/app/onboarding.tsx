import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../src/api";
import { useAuth } from "../src/auth";
import { CITIES, CityPreset } from "../src/cities";
import { colors, spacing, text } from "../src/theme";

function isValidDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  return m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= new Date().getFullYear();
}
function isValidTime(s: string) {
  if (!/^\d{2}:\d{2}$/.test(s)) return false;
  const [h, m] = s.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export default function Onboarding() {
  const { refresh } = useAuth();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [city, setCity] = useState<CityPreset | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return CITIES.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q),
    );
  }, [search]);

  const submit = async () => {
    if (!city) return;
    setLoading(true);
    setError(null);
    try {
      await api.saveBirthData({
        birth_date: date,
        birth_time: time,
        birth_place: `${city.name}, ${city.country}`,
        birth_lat: city.lat,
        birth_lng: city.lng,
      });
      await refresh();
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "Could not save");
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
        <View style={s.header}>
          <Text style={text.label}>STEP {step + 1} / 3</Text>
          <View style={s.progressRow}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  s.progressBar,
                  i <= step ? { backgroundColor: colors.textPrimary } : null,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={s.content}>
          {step === 0 && (
            <>
              <Text style={[text.h1, s.title]}>When{"\n"}did you{"\n"}arrive?</Text>
              <Text style={[text.bodyDim, s.subtitle]}>
                Your birth date. Be precise. Vague entries get vague readings.
              </Text>
              <TextInput
                testID="onboarding-date-input"
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
                style={s.input}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </>
          )}
          {step === 1 && (
            <>
              <Text style={[text.h1, s.title]}>What{"\n"}hour?</Text>
              <Text style={[text.bodyDim, s.subtitle]}>
                Local time of birth. If you don&apos;t know, guess noon. The rising sign will be a lie.
              </Text>
              <TextInput
                testID="onboarding-time-input"
                value={time}
                onChangeText={setTime}
                placeholder="HH:MM (24h)"
                placeholderTextColor={colors.textTertiary}
                style={s.input}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </>
          )}
          {step === 2 && (
            <>
              <Text style={[text.h1, s.title]}>Where?</Text>
              <Text style={[text.bodyDim, s.subtitle]}>
                Geography matters. The sky was different over you.
              </Text>
              <TouchableOpacity
                testID="onboarding-city-picker"
                style={s.cityPicker}
                onPress={() => setShowPicker(true)}
              >
                <Text style={city ? text.bodyLg : [text.bodyLg, { color: colors.textTertiary }]}>
                  {city ? `${city.name}, ${city.country}` : "Select a city"}
                </Text>
                <Text style={[text.label, { color: colors.textPrimary }]}>▸</Text>
              </TouchableOpacity>
            </>
          )}

          {error ? (
            <Text testID="onboarding-error" style={s.error}>
              {error}
            </Text>
          ) : null}
        </View>

        <View style={s.footer}>
          {step > 0 ? (
            <TouchableOpacity
              testID="onboarding-back-button"
              style={s.secondaryBtn}
              onPress={() => setStep((step - 1) as 0 | 1 | 2)}
              disabled={loading}
            >
              <Text style={s.secondaryBtnText}>BACK</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <TouchableOpacity
            testID="onboarding-next-button"
            style={[s.primaryBtn, loading && { opacity: 0.6 }]}
            disabled={
              loading ||
              (step === 0 && !isValidDate(date)) ||
              (step === 1 && !isValidTime(time)) ||
              (step === 2 && !city)
            }
            onPress={() => {
              if (step === 2) submit();
              else setStep(((step + 1) as 0 | 1 | 2));
            }}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={s.primaryBtnText}>{step === 2 ? "CALCULATE" : "NEXT"}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showPicker} animationType="slide" transparent={false}>
        <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
          <View style={{ padding: spacing.lg, gap: spacing.md, flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={text.h3}>Select city</Text>
              <Pressable
                testID="city-picker-close"
                onPress={() => setShowPicker(false)}
                hitSlop={12}
              >
                <Text style={[text.label, { color: colors.textPrimary }]}>CLOSE</Text>
              </Pressable>
            </View>
            <TextInput
              testID="city-picker-search"
              value={search}
              onChangeText={setSearch}
              placeholder="Search"
              placeholderTextColor={colors.textTertiary}
              style={s.input}
            />
            <FlatList
              data={filtered}
              keyExtractor={(c) => c.name + c.country}
              renderItem={({ item }) => (
                <TouchableOpacity
                  testID={`city-option-${item.name}`}
                  style={s.cityRow}
                  onPress={() => {
                    setCity(item);
                    setShowPicker(false);
                  }}
                >
                  <Text style={text.bodyLg}>{item.name}</Text>
                  <Text style={text.bodyDim}>{item.country}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: { padding: spacing.lg, gap: spacing.sm },
  progressRow: { flexDirection: "row", gap: spacing.xs },
  progressBar: { flex: 1, height: 2, backgroundColor: colors.border },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.lg },
  title: { marginBottom: spacing.sm },
  subtitle: { marginBottom: spacing.lg },
  input: {
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: "Inter_400Regular",
  },
  cityPicker: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  error: { color: colors.crimson, fontFamily: "Inter_500Medium" },
  footer: { flexDirection: "row", padding: spacing.lg, gap: spacing.md },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.textPrimary,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: colors.textInverse,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: 2,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.textPrimary,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: 2,
  },
  cityRow: {
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
