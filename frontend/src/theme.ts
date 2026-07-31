// Lumina brand — deep royal violet + luminous gold, mystical dark theme.
export const colors = {
  // Backgrounds — very deep violet-black, tuned to match the logo art
  bg: "#0B0418",
  bgElevated: "#140829",
  surface: "#1A0E33",
  surfaceElevated: "#22133F",
  border: "#2E1B4D",
  borderFocus: "#F0C560",

  // Brand accents
  violet: "#5B2FCB",        // primary brand violet (like the logo halo)
  violetDeep: "#3A1580",    // deeper background violet
  violetSoft: "#7A4EEB",    // hover/pressed / secondary
  gold: "#F0C560",          // primary gold (letter L, stars)
  goldDeep: "#C79A3E",      // pressed/deeper gold
  goldSoft: "#F7DDA0",      // highlights

  // Text
  textPrimary: "#F4EDE0",   // parchment white
  textSecondary: "#B8AACB",
  textTertiary: "#6E5F86",
  textInverse: "#0B0418",
  textOnGold: "#0B0418",

  // Feedback
  crimson: "#C93A5B",
  success: "#6BD4A3",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const radii = {
  sm: 6,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const fonts = {
  heading: "CormorantGaramond_400Regular",
  headingLight: "CormorantGaramond_300Light",
  headingMedium: "CormorantGaramond_500Medium",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemibold: "Inter_600SemiBold",
  mono: "System",
};

export const text = {
  h1: {
    fontFamily: fonts.headingLight,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -1.5,
    color: colors.textPrimary,
  },
  h2: {
    fontFamily: fonts.heading,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  h3: {
    fontFamily: fonts.heading,
    fontSize: 24,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  bodyLg: {
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  bodyDim: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  label: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    color: colors.gold,
    textTransform: "uppercase" as const,
  },
  labelMuted: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.5,
    color: colors.textSecondary,
    textTransform: "uppercase" as const,
  },
} as const;

// Reusable gradients (arrays for expo-linear-gradient)
export const gradients = {
  bg: ["#0B0418", "#1A0E33", "#0B0418"] as const,
  brand: ["#3A1580", "#5B2FCB"] as const,
  gold: ["#F7DDA0", "#F0C560", "#C79A3E"] as const,
  card: ["#1A0E33", "#22133F"] as const,
};
