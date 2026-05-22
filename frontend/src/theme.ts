export const colors = {
  bg: "#000000",
  surface: "#121212",
  surfaceElevated: "#1A1A1A",
  border: "#262626",
  borderFocus: "#F4F0E6",
  textPrimary: "#F4F0E6",
  textSecondary: "#A3A3A3",
  textTertiary: "#666666",
  textInverse: "#000000",
  crimson: "#A91D1D",
  gold: "#C5A059",
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

export const fonts = {
  heading: "CormorantGaramond_400Regular",
  headingLight: "CormorantGaramond_300Light",
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
    letterSpacing: 1.5,
    color: colors.textSecondary,
    textTransform: "uppercase" as const,
  },
} as const;
