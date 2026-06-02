const palette = {
  // Primary
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#5A4BD1',

  // Secondary
  secondary: '#00CEC9',
  secondaryLight: '#55EFC4',

  // Accent
  accent: '#FD79A8',
  accentLight: '#FDB8D0',

  // Semantic
  income: '#00B894',
  incomeLight: '#55EFC4',
  expense: '#E17055',
  expenseLight: '#FAB1A0',
  warning: '#FDCB6E',
  warningDark: '#F39C12',
  info: '#74B9FF',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
};

export const colors = {
  dark: {
    background: '#0D1117',
    surface: '#161B22',
    surfaceElevated: '#21262D',
    card: '#1C2128',
    cardHover: '#242B35',
    border: '#30363D',
    borderLight: '#21262D',

    text: '#F0F6FC',
    textSecondary: '#8B949E',
    textMuted: '#484F58',
    textInverse: '#0D1117',

    ...palette,

    // Tab bar
    tabBar: '#0D1117',
    tabBarBorder: '#21262D',
    tabBarActive: palette.primary,
    tabBarInactive: '#484F58',

    // Gradients (start, end)
    gradientPrimary: ['#6C5CE7', '#A29BFE'] as readonly [string, string],
    gradientSecondary: ['#00CEC9', '#55EFC4'] as readonly [string, string],
    gradientCross: ['#6C5CE7', '#00CEC9'] as readonly [string, string],
    gradientIncome: ['#00B894', '#55EFC4'] as readonly [string, string],
    gradientExpense: ['#E17055', '#FAB1A0'] as readonly [string, string],
    gradientDark: ['#161B22', '#0D1117'] as readonly [string, string],

    // Glassmorphism
    glass: 'rgba(22, 27, 34, 0.6)',
    glassBorder: 'rgba(48, 54, 61, 0.5)',
  },
  light: {
    background: '#F6F8FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    card: '#FFFFFF',
    cardHover: '#F3F4F6',
    border: '#D0D7DE',
    borderLight: '#E8ECEF',

    text: '#1F2328',
    textSecondary: '#656D76',
    textMuted: '#8B949E',
    textInverse: '#FFFFFF',

    ...palette,

    tabBar: '#FFFFFF',
    tabBarBorder: '#D0D7DE',
    tabBarActive: palette.primary,
    tabBarInactive: '#8B949E',

    gradientPrimary: ['#6C5CE7', '#A29BFE'] as readonly [string, string],
    gradientSecondary: ['#00CEC9', '#55EFC4'] as readonly [string, string],
    gradientCross: ['#6C5CE7', '#00CEC9'] as readonly [string, string],
    gradientIncome: ['#00B894', '#55EFC4'] as readonly [string, string],
    gradientExpense: ['#E17055', '#FAB1A0'] as readonly [string, string],
    gradientDark: ['#F6F8FA', '#FFFFFF'] as readonly [string, string],

    glass: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(208, 215, 222, 0.5)',
  },
};

// Category colors for charts and badges
export const categoryColors = [
  '#6C5CE7', // Purple
  '#00CEC9', // Teal
  '#FD79A8', // Pink
  '#FDCB6E', // Yellow
  '#74B9FF', // Blue
  '#E17055', // Orange
  '#00B894', // Green
  '#A29BFE', // Lavender
  '#FF7675', // Red
  '#55EFC4', // Mint
  '#DFE6E9', // Gray
  '#FAB1A0', // Peach
];

export type ThemeMode = 'dark' | 'light';
export type ThemeColors = typeof colors.dark;
