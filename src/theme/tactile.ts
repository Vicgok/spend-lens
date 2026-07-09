import { colors, hexToRgba, sheetColors } from './colors';

export const tactileTheme = {
  background: sheetColors.background,
  shellBackground: sheetColors.tactileBackground,
  surface: sheetColors.surface,
  surfaceRaised: sheetColors.surfaceRaised,
  border: sheetColors.border,
  borderLight: colors.light.borderLight,
  primary: sheetColors.textPrimary,
  secondary: sheetColors.textSecondary,
  textPrimary: sheetColors.textPrimary,
  textSecondary: sheetColors.textSecondary,
  textMuted: sheetColors.tactileMuted,
  green: sheetColors.forest,
  forest: sheetColors.forest,
  lightGreen: sheetColors.leafLight,
  accentBrown: sheetColors.tactileAccentBrown,
  expense: sheetColors.tactileExpense,
  savings: sheetColors.tactileSavings,
  grid: sheetColors.tactileGrid,
  paperWhite: sheetColors.tactilePaperWhite,
  overlayStrong: 'rgba(15, 12, 10, 0.72)',
  overlayStronger: 'rgba(15, 12, 10, 0.75)',
  pressedNeutral: hexToRgba(sheetColors.textPrimary, 0.04),
  initialPalette: [
    sheetColors.tactileExpense,
    sheetColors.forest,
    sheetColors.tactileSavings,
    sheetColors.textPrimary,
    sheetColors.tactileAccentBrown,
    '#8C9168',
  ] as const,
  tabBar: {
    active: sheetColors.forest,
    inactive: sheetColors.tactileMuted,
    surface: sheetColors.surface,
    border: colors.light.border,
    shadow: sheetColors.textPrimary,
  },
} as const;

export function buildAlphaColor(color: string, alpha: number) {
  return hexToRgba(color, alpha);
}
