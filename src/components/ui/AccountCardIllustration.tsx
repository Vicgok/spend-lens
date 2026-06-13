import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '@/theme';

const COLOR_FOREST_GREEN = tokens.colors.forest;

const AccountCardIllustrationBase = () => (
  <Svg width={42} height={42} viewBox="0 0 50 50" style={{ position: 'absolute', right: 8, bottom: 8, opacity: 0.10 }}>
    <Path
      d="M 12 38 Q 24 26 38 12"
      fill="none"
      stroke={COLOR_FOREST_GREEN}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <Path
      d="M 38 12 C 32 14, 28 20, 31 25 C 34 30, 40 24, 38 12 Z"
      fill={COLOR_FOREST_GREEN}
    />
    <Path
      d="M 24 24 C 18 26, 14 32, 17 37 C 20 42, 26 38, 24 24 Z"
      fill={COLOR_FOREST_GREEN}
    />
  </Svg>
);

export const AccountCardIllustration = React.memo(AccountCardIllustrationBase);
export default AccountCardIllustration;
