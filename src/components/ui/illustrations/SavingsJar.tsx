import React from 'react';
import Svg, { Circle, Rect, Path } from 'react-native-svg';
import { tokens } from '@/theme';

const COLOR_FOREST_GREEN = tokens.colors.forest;
const COLOR_DEEP_BROWN = tokens.colors.textPrimary;
const COLOR_ACCENT_BROWN = '#B7884E';

const SavingsJarIllustrationBase = () => (
  <Svg width={100} height={90} viewBox="0 0 110 100">
    <Circle cx={65} cy={55} r={32} fill="rgba(62, 90, 42, 0.04)" />

    {/* Coins outside */}
    <Rect x={38} y={72} width={12} height={4} rx={1.5} fill="#D4A373" stroke={COLOR_DEEP_BROWN} strokeWidth={0.8} />
    <Rect x={38} y={75} width={12} height={4} rx={1.5} fill={COLOR_ACCENT_BROWN} stroke={COLOR_DEEP_BROWN} strokeWidth={0.8} />
    <Rect x={38} y={78} width={12} height={4} rx={1.5} fill={COLOR_ACCENT_BROWN} stroke={COLOR_DEEP_BROWN} strokeWidth={0.8} />

    <Rect x={50} y={66} width={12} height={4} rx={1.5} fill="#D4A373" stroke={COLOR_DEEP_BROWN} strokeWidth={0.8} />
    <Rect x={50} y={69} width={12} height={4} rx={1.5} fill={COLOR_ACCENT_BROWN} stroke={COLOR_DEEP_BROWN} strokeWidth={0.8} />
    <Rect x={50} y={72} width={12} height={4} rx={1.5} fill={COLOR_ACCENT_BROWN} stroke={COLOR_DEEP_BROWN} strokeWidth={0.8} />
    <Rect x={50} y={75} width={12} height={4} rx={1.5} fill={COLOR_ACCENT_BROWN} stroke={COLOR_DEEP_BROWN} strokeWidth={0.8} />
    <Rect x={50} y={78} width={12} height={4} rx={1.5} fill={COLOR_ACCENT_BROWN} stroke={COLOR_DEEP_BROWN} strokeWidth={0.8} />

    {/* Jar Body */}
    <Path
      d="M 52 32 C 52 32, 48 37, 48 48 C 48 68, 54 78, 68 78 C 82 78, 88 68, 88 48 C 88 37, 84 32, 84 32 Z"
      fill="rgba(255, 255, 255, 0.7)"
      stroke={COLOR_DEEP_BROWN}
      strokeWidth={1.5}
    />

    {/* Coins inside */}
    <Rect x={58} y={70} width={10} height={3.5} rx={1} fill={COLOR_ACCENT_BROWN} stroke={COLOR_DEEP_BROWN} strokeWidth={0.8} />
    <Rect x={66} y={64} width={10} height={3.5} rx={1} fill={COLOR_ACCENT_BROWN} stroke={COLOR_DEEP_BROWN} strokeWidth={0.8} />
    <Rect x={66} y={67.5} width={10} height={3.5} rx={1} fill={COLOR_ACCENT_BROWN} stroke={COLOR_DEEP_BROWN} strokeWidth={0.8} />

    {/* Jar neck */}
    <Path d="M 54 32 L 82 32 L 80 28 L 56 28 Z" fill="#FFFFFF" stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} />
    {/* Lid */}
    <Path d="M 58 28 L 78 28 C 78 28, 77 22, 68 22 C 59 22, 58 28, 58 28 Z" fill="#D4A373" stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} />

    {/* Plant Vine */}
    <Path d="M 44 82 Q 42 70 48 64 Q 50 60 49 55" fill="none" stroke={COLOR_FOREST_GREEN} strokeWidth={1.2} />
    <Path d="M 43 72 C 40 70, 39 74, 43 72 Z" fill={COLOR_FOREST_GREEN} stroke={COLOR_FOREST_GREEN} strokeWidth={0.5} />
    <Path d="M 46 66 C 48 64, 48 68, 46 66 Z" fill={COLOR_FOREST_GREEN} stroke={COLOR_FOREST_GREEN} strokeWidth={0.5} />

    {/* Sparkles */}
    <Path d="M 32 40 L 34 40 M 33 39 L 33 41" stroke={COLOR_ACCENT_BROWN} strokeWidth={0.8} />
    <Path d="M 95 38 L 97 38 M 96 37 L 96 39" stroke={COLOR_ACCENT_BROWN} strokeWidth={0.8} />
  </Svg>
);

export const SavingsJarIllustration = React.memo(SavingsJarIllustrationBase);
export default SavingsJarIllustration;
