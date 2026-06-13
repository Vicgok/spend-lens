import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '@/theme';

const COLOR_FOREST_GREEN = tokens.colors.forest;

const QuickOverviewLeafIllustrationBase = () => (
  <Svg width={24} height={24} viewBox="0 0 30 30" style={{ position: 'absolute', right: 4, bottom: 4, opacity: 0.08 }}>
    <Path
      d="M 6 24 C 12 18, 18 12, 24 6"
      fill="none"
      stroke={COLOR_FOREST_GREEN}
      strokeWidth={1.2}
      strokeLinecap="round"
    />
    <Path
      d="M 24 6 C 20 8, 18 12, 20 15 Z"
      fill={COLOR_FOREST_GREEN}
    />
  </Svg>
);

export const QuickOverviewLeafIllustration = React.memo(QuickOverviewLeafIllustrationBase);
export default QuickOverviewLeafIllustration;
