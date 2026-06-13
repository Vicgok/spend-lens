export { colors, categoryColors, sheetColors } from './colors';
export type { ThemeMode, ThemeColors } from './colors';
export { typography, sheetType } from './types';
export { spacing, borderRadius, iconSizes, sheetRadii, sheetSpacing } from './spacings';
export { shadows, sheetShadow } from './shadow';

import { sheetColors } from './colors';
import { sheetRadii, sheetSpacing } from './spacings';
import { sheetType } from './types';
import { sheetShadow } from './shadow';

export const tokens = {
  colors: sheetColors,
  radii: sheetRadii,
  spacing: sheetSpacing,
  type: sheetType,
  shadow: sheetShadow,
};
