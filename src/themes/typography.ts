export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const typography = {
  display: {
    xs: {
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: 24 * -0.03,
    },
    sm: {
      fontSize: 30,
      lineHeight: 38,
      letterSpacing: 30 * -0.03,
    },
    md: {
      fontSize: 36,
      lineHeight: 44,
      letterSpacing: 36 * -0.03,
    },
    lg: {
      fontSize: 48,
      lineHeight: 60,
      letterSpacing: 48 * -0.03,
    },
    xl: {
      fontSize: 60,
      lineHeight: 72,
      letterSpacing: 60 * -0.04,
    },
    '2xl': {
      fontSize: 72,
      lineHeight: 90,
      letterSpacing: 72 * -0.04,
    },
  },

  text: {
    xs: {
      fontSize: 12,
      lineHeight: 18,
      letterSpacing: 12 * -0.03,
    },
    sm: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 14 * -0.03,
    },
    md: {
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 16 * -0.03,
    },
    lg: {
      fontSize: 18,
      lineHeight: 28,
      letterSpacing: 18 * -0.03,
    },
    xl: {
      fontSize: 20,
      lineHeight: 30,
      letterSpacing: 20 * -0.03,
    },
  },
} as const;
