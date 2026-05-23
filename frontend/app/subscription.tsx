import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PaymentButton } from "../src/components/PaymentButton";
import { PlanKey } from "../src/payments/PaymentProvider";
import { colors, fonts, spacing, text } from "../src/theme";

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------
type Plan = {
  key: PlanKey;
  name: string;
  price: string;
  period: string;
  monthly?: string;
  badge?: string;
  tagline: string;
  perks: string[];
  hero?: boolean;
};

const PLANS: Plan[] = [
  {
    key: "glow",
    name: "Glow",
    price: "€9.99",
    period: "/ mois",
    tagline: "Le deck sans limites.",
    hero: true,
    perks: [
      "Tirages illimités chaque jour",
      "Interprétations profondes",
      "Compatibilité complète",
      "Horoscope personnalisé quotidien",
      "7 jours d'essai gratuit",
    ],
  },
  {
    key: "luxe",
    name: "Luxe",
    price: "€79",
    period: "/ an",
    monthly: "soit €6.58 / mois",
    badge: "Meilleur choix",
    tagline: "Une année entière. Rien à cacher.",
    perks: [
      "Tout Glow inclus",
      "Tirages en avant-première",
      "Spreads exclusifs (Croix Celtique, Relation, Avenir)",
      "7 jours d'essai gratuit",
    ],
  },
  {
    key: "credits",
    name: "Pack Crédits",
    price: "€4.99",
    period: "une fois",
    tagline: "20 crédits. Quand tu en as besoin.",
    perks: [
      "20 tirages à utiliser quand tu veux",
      "Pas d'abonnement",
      "Compatible avec le plan Free",
    ],
  },
];

// ---------------------------------------------------------------------------
// PlanCard
// ---------------------------------------------------------------------------
function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        s.card,
        plan.hero && s.cardHero,
        selected && s.cardSelected,
        pressed && { opacity: 0.9 },
      ]}
    >
      {plan.hero && (
        <LinearGradient
          colors={["#1A0A2A", "#0F0A18"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      {/* Badge */}
      {plan.badge && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{plan.badge}</Text>
        </View>
      )}

      {/* Header */}
      <View style={s.cardHeader}>
        <View>
          <Text style={[s.planName, plan.hero && s.planNameHero]}>{plan.name}</Text>
          <Text style={s.tagline}>{plan.tagline}</Text>
        </View>
        <View style={s.priceBlock}>
          <Text style={[s.price, plan.hero && s.priceHero]}>{plan.price}</Text>
          <Text style={s.period}>{plan.period}</Text>
        </View>
      </View>

      {plan.monthly && (
        <Text style={s.monthly}>{plan.monthly}</Text>
      )}

      {/* Perks */}
      <View style={s.perks}>
        {plan.perks.map((perk, i) => (
          <View key={i} style={s.perk}>
            <Text style={s.perkDot}>✦</Text>
            <Text style={s.perkText}>{perk}</Text>
          </View>
        ))}
      </View>

      {/* Selection indicator */}
      {selected && (
        <View style={s.selectIndicator}>
          <Ionicons name="checkmark-circle" size={20} color={colors.gold} />
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function SubscriptionScreen() {
  const [selected, setSelected] = useState<PlanKey>("glow");
  const [payError, setPayError] = useState<string | null>(null);

  const activePlan = PLANS.find((p) => p.key === selected)!;

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      {/* Ambient top glow */}
      <LinearGradient
        colors={["rgba(75,0,130,0.35)", "transparent"]}
        style={s.topGlow}
        pointerEvents="none"
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Close */}
        <Pressable style={s.closeBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.textSecondary} />
        </Pressable>

        {/* Hero copy */}
        <Text style={text.label}>LUMINA PREMIUM</Text>
        <Text style={[text.h1, s.headline]}>
          Les cartes{"\n"}n'attendent pas.
        </Text>
        <Text style={[text.bodyDim, s.sub]}>
          Choisis ton plan. Révèle tout.
        </Text>

        {/* Plan cards */}
        <View style={s.plans}>
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              selected={selected === plan.key}
              onSelect={() => setSelected(plan.key)}
            />
          ))}
        </View>

        {/* Trial note */}
        {(selected === "glow" || selected === "luxe") && (
          <View style={s.trialNote}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.gold} />
            <Text style={s.trialText}>
              7 jours gratuits · Annule à tout moment
            </Text>
          </View>
        )}

        {/* Payment button */}
        <View style={s.paySection}>
          {payError && <Text style={s.payError}>{payError}</Text>}
          <PaymentButton
            plan={selected}
            label={
              selected === "credits"
                ? `ACHETER 20 CRÉDITS · ${activePlan.price}`
                : `COMMENCER MON ESSAI GRATUIT`
            }
            onSuccess={() => router.replace("/(tabs)/profile")}
            onError={setPayError}
          />
        </View>

        <Text style={s.fine}>
          {selected === "credits"
            ? "Achat unique, non remboursable."
            : "Abonnement auto-renouvelé. Annulable depuis les réglages."}
          {"\n"}Paiement sécurisé par Stripe.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  closeBtn: { alignSelf: "flex-end" },
  headline: { marginTop: spacing.xs },
  sub: { fontSize: 16, lineHeight: 24, marginTop: -spacing.sm },

  plans: { gap: spacing.md },

  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    overflow: "hidden",
    gap: spacing.md,
  },
  cardHero: {
    borderColor: colors.purpleLight,
  },
  cardSelected: {
    borderColor: colors.gold,
    borderWidth: 1.5,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: -spacing.xs,
  },
  badgeText: {
    color: colors.textInverse,
    fontFamily: fonts.bodySemibold,
    fontSize: 10,
    letterSpacing: 1,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  planName: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.textPrimary,
    lineHeight: 26,
  },
  planNameHero: { color: colors.gold },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priceBlock: { alignItems: "flex-end" },
  price: {
    fontFamily: "CormorantGaramond_300Light",
    fontSize: 36,
    color: colors.textPrimary,
    letterSpacing: -1,
    lineHeight: 40,
  },
  priceHero: { color: colors.gold },
  period: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  monthly: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.pink,
    marginTop: -spacing.sm,
  },

  perks: { gap: spacing.sm },
  perk: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  perkDot: { color: colors.gold, fontSize: 10, lineHeight: 20 },
  perkText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  selectIndicator: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
  },

  trialNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: -spacing.sm,
  },
  trialText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.gold,
    letterSpacing: 0.5,
  },

  paySection: { gap: spacing.sm },
  payError: {
    color: colors.error,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    textAlign: "center",
  },

  fine: {
    color: colors.textTertiary,
    fontSize: 11,
    fontFamily: fonts.body,
    textAlign: "center",
    lineHeight: 16,
  },
});
