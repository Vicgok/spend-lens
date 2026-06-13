import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: {
    regular: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    semibold: 'Poppins-SemiBold',
    bold: 'Poppins-Bold',
    mono: 'JetBrainsMono-Regular',
    monoBold: 'JetBrainsMono-Bold',
  },
  android: {
    regular: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    semibold: 'Poppins-SemiBold',
    bold: 'Poppins-Bold',
    mono: 'JetBrainsMono-Regular',
    monoBold: 'JetBrainsMono-Bold',
  },
  default: {
    regular: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    semibold: 'Poppins-SemiBold',
    bold: 'Poppins-Bold',
    mono: 'JetBrainsMono-Regular',
    monoBold: 'JetBrainsMono-Bold',
  },
})!;

export const typography = {
  fontFamily,

  // Type scale (as specified in Swiss guidelines)
  sizes: {
    micro: 11,
    caption: 13,
    body: 16,
    section: 18,
    heading: 24,
    display: 32,

    // Backward compatibility mappings
    xs: 11,
    sm: 13,
    base: 16,
    md: 16,
    lg: 18,
    xl: 24,
    '2xl': 24,
    '3xl': 32,
    '4xl': 32,
  },

  lineHeights: {
    micro: 16,
    caption: 18,
    body: 22,
    section: 24,
    heading: 30,
    display: 38,
  },

  // Presets using maximum 2 weights per screen to maintain editorial style
  display: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    lineHeight: 38,
  },
  heading: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
  },
  section: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  micro: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  // Backward compatibility presets to avoid breaking existing code
  heading1: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    lineHeight: 38,
  },
  heading2: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
  },
  heading3: {
    fontFamily: fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  heading4: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  bodySm: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  amount: {
    fontFamily: fontFamily.mono,
    fontSize: 24,
    lineHeight: 32,
  },
  amountLarge: {
    fontFamily: fontFamily.monoBold,
    fontSize: 32,
    lineHeight: 38,
  },
  amountSmall: {
    fontFamily: fontFamily.mono,
    fontSize: 16,
    lineHeight: 22,
  },
} as const;

export const sheetType = {
  title: { fontSize: 32, fontWeight: '700' as const, color: '#745143' },
  subtitle: { fontSize: 16, fontWeight: '400' as const, color: '#54554B', lineHeight: 22 },
  section: { fontSize: 18, fontWeight: '600' as const, color: '#745143' },
  body: { fontSize: 16, fontWeight: '400' as const, color: '#745143' },
  bodyMuted: { fontSize: 14, fontWeight: '400' as const, color: '#54554B' },
  cta: { fontSize: 20, fontWeight: '600' as const, color: '#FFF8EE' },
} as const;

