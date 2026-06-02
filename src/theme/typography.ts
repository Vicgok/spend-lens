import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    mono: 'JetBrainsMono-Regular',
    monoBold: 'JetBrainsMono-Bold',
  },
  android: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    mono: 'JetBrainsMono-Regular',
    monoBold: 'JetBrainsMono-Bold',
  },
  default: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    mono: 'JetBrainsMono-Regular',
    monoBold: 'JetBrainsMono-Bold',
  },
})!;

export const typography = {
  fontFamily,

  // Type scale
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 36,
    '4xl': 48,
  },

  lineHeights: {
    xs: 16,
    sm: 18,
    base: 22,
    md: 24,
    lg: 28,
    xl: 32,
    '2xl': 38,
    '3xl': 44,
    '4xl': 56,
  },

  // Presets
  heading1: {
    fontFamily: fontFamily.bold,
    fontSize: 36,
    lineHeight: 44,
  },
  heading2: {
    fontFamily: fontFamily.bold,
    fontSize: 30,
    lineHeight: 38,
  },
  heading3: {
    fontFamily: fontFamily.semibold,
    fontSize: 24,
    lineHeight: 32,
  },
  heading4: {
    fontFamily: fontFamily.semibold,
    fontSize: 20,
    lineHeight: 28,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySm: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  amount: {
    fontFamily: fontFamily.mono,
    fontSize: 24,
    lineHeight: 32,
  },
  amountLarge: {
    fontFamily: fontFamily.monoBold,
    fontSize: 36,
    lineHeight: 44,
  },
  amountSmall: {
    fontFamily: fontFamily.mono,
    fontSize: 15,
    lineHeight: 22,
  },
} as const;
