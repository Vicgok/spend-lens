const onboarding = {
  background: '#e1d7c2',
  primary: '#745143',
  brandGreen: '#3E5A2A',
  accentCardBg: '#B7884E',
  accentCardTitle: '#FFF8EE',
  accentCardSubtitle: '#F4E6D0',
  accentCardIconBg: '#E8DCC6',
  accentCardDot: '#6EEB83',
  mutedText: '#54554b',
  pillInactive: 'rgba(116, 81, 67, 0.3)',
};

const palette = {
  // Primary / Accent (Lime)
  primary: '#A0C42C',
  primaryLight: '#B8D943',
  primaryDark: '#87A623',

  // Semantic
  income: '#2E7D32',
  incomeLight: '#4CAF50',
  expense: '#C84B31',
  expenseLight: '#E57373',
  warning: '#C28A24',
  warningDark: '#A06E1A',
  info: '#1976D2',

  // Neutrals
  white: '#FDFCF8', // Warm paper white
  black: '#1B1B1B', // Dark carbon black
};

export const colors = {
  dark: {
    onboarding,
    background: '#121210', // Dark warm background
    surface: '#1E1E1C', // Dark paper surface
    surfaceElevated: '#282825',
    card: '#1E1E1C',
    cardHover: '#282825',
    border: '#333330',
    borderLight: '#282825',

    text: '#F5F3EE',
    textSecondary: '#A5A39E',
    textMuted: '#666664',
    textInverse: '#1B1B1B',

    ...palette,

    // Tab bar
    tabBar: '#1E1E1C',
    tabBarBorder: '#333330',
    tabBarActive: palette.primary,
    tabBarInactive: '#666664',

    // Gradients (minimal, flat curves)
    gradientPrimary: ['#A0C42C', '#B8D943'] as readonly [string, string],
    gradientSecondary: ['#2E7D32', '#4CAF50'] as readonly [string, string],
    gradientCross: ['#A0C42C', '#2E7D32'] as readonly [string, string],
    gradientIncome: ['#2E7D32', '#4CAF50'] as readonly [string, string],
    gradientExpense: ['#C84B31', '#E57373'] as readonly [string, string],
    gradientDark: ['#1E1E1C', '#121210'] as readonly [string, string],

    // Glassmorphism (flat borders)
    glass: 'rgba(30, 30, 28, 0.8)',
    glassBorder: 'rgba(51, 51, 48, 0.6)',
  },
  light: {
    onboarding,
    background: '#F5F3EE', // Warm neutral background
    surface: '#FDFCF8', // Tactile paper card background
    surfaceElevated: '#FDFCF8',
    card: '#FDFCF8',
    cardHover: '#F6F5F0',
    border: '#1F1F1F', // Thin dark carbon border
    borderLight: '#E5E3DE',

    text: '#1B1B1B', // Dark carbon text
    textSecondary: '#666666',
    textMuted: '#999999',
    textInverse: '#F5F3EE',

    ...palette,

    tabBar: '#FDFCF8',
    tabBarBorder: '#1F1F1F',
    tabBarActive: palette.primary,
    tabBarInactive: '#999999',

    gradientPrimary: ['#A0C42C', '#B8D943'] as readonly [string, string],
    gradientSecondary: ['#2E7D32', '#4CAF50'] as readonly [string, string],
    gradientCross: ['#A0C42C', '#2E7D32'] as readonly [string, string],
    gradientIncome: ['#2E7D32', '#4CAF50'] as readonly [string, string],
    gradientExpense: ['#C84B31', '#E57373'] as readonly [string, string],
    gradientDark: ['#FDFCF8', '#F5F3EE'] as readonly [string, string],

    glass: 'rgba(253, 252, 248, 0.9)',
    glassBorder: 'rgba(31, 31, 31, 0.2)',
  },
};

// Category colors for charts and badges (aligned with Swiss tones)
export const categoryColors = [
  '#A0C42C', // lime accent
  '#2E7D32', // green
  '#C84B31', // red-orange
  '#C28A24', // ochre
  '#3E5C76', // blue slate
  '#7E6B8F', // muted violet
  '#D4A373', // sand
  '#4A5759', // olive grey
  '#A5A39E', // warm grey
  '#6D597A', // plum
  '#E07A5F', // terracotta
  '#1F1F1F', // black border
];

export type ThemeMode = 'dark' | 'light';
export type ThemeColors = typeof colors.dark;

export const sheetColors = {
  // Surfaces
  overlay: 'rgba(0,0,0,0.35)',
  background: '#E1D7C2',
  surface: '#FFF8EE',
  surfaceRaised: '#FFFDF8',
  border: '#E8DDD0',
  cardBg: '#FFFDF8',

  // Text
  textPrimary: '#745143',
  textSecondary: '#54554B',
  textSecondaryMockup: '#7A7669',

  // Brand greens
  forest: '#3E5A2A',
  forestSoft: '#4F6D3A',
  leafLight: '#EEF4E6',

  // Illustration
  notebookCream: '#F5E9D8',
  illoOutline: '#9B7B5B',
  illoFace: '#5B4333',
  leafFill: '#D4D0A1',
  leafStroke: '#9B966A',
  ground: '#DCCFBB',
  pencilWood: '#D8B58A',
  pencilEraser: '#C97B6B',

  // AddFinancialSourceSheet Mockup specific colors
  iconOutline: '#6B4A39',
  walletBrown: '#8C5A3C',
  walletDark: '#5B3A28',
  cardYellow: '#E8C66A',
  cardStripe: '#3E5A2A',
  cashGreen: '#9FC07A',
  cashGreenDark: '#5D7E45',
  rupeeRed: '#C0533A',

  // SproutCoinMascot specific colors
  sproutBodyFill: '#E2E6C4',
  sproutBodyStroke: '#8C9A6B',
  sproutLeafFill: '#C8D29A',
  sproutLeafStroke: '#7E8B58',
  sproutTwig: '#A78463',
  sproutFace: '#5B4A37',
  sproutCheek: '#E8B7A0',
  sproutGround: '#E7DFC9',
  sproutSparkle: '#D8C98A',

  white: '#FFFFFF',
} as const;

