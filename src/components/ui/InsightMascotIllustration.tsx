import React from 'react';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';
import { tokens } from '@/theme';

const COLOR_FOREST_GREEN = tokens.colors.forest;
const COLOR_DEEP_BROWN = tokens.colors.textPrimary;
const COLOR_ACCENT_BROWN = '#B7884E';

const InsightMascotIllustrationBase = () => (
  <Svg width={90} height={72} viewBox="0 0 100 80">
    <Circle cx={38} cy={46} r={18} fill="#FAF9F7" stroke={COLOR_DEEP_BROWN} strokeWidth={1.8} />
    <Circle cx={38} cy={46} r={15} fill="rgba(62, 90, 42, 0.05)" />

    {/* Eyes */}
    <Path d="M 29 46 Q 31 48 33 46" stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} strokeLinecap="round" fill="none" />
    <Path d="M 43 46 Q 45 48 47 46" stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} strokeLinecap="round" fill="none" />

    <Circle cx={24} cy={49} r={1.8} fill={COLOR_FOREST_GREEN} opacity={0.3} />
    <Circle cx={52} cy={49} r={1.8} fill={COLOR_FOREST_GREEN} opacity={0.3} />

    {/* Antenna */}
    <Path d="M 38 28 L 38 24" stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} />
    <Circle cx={38} cy={22} r={2.5} fill={COLOR_ACCENT_BROWN} stroke={COLOR_DEEP_BROWN} strokeWidth={1} />

    {/* Book */}
    <Rect x={44} y={44} width={22} height={16} rx={3} fill="#FAF9F7" stroke={COLOR_DEEP_BROWN} strokeWidth={1.5} />
    <Line x1={48} y1={49} x2={58} y2={49} stroke={COLOR_DEEP_BROWN} strokeWidth={1} opacity={0.6} />
    <Line x1={48} y1={54} x2={62} y2={54} stroke={COLOR_DEEP_BROWN} strokeWidth={1} opacity={0.6} />

    <Path d="M 32 64 L 30 71" stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} strokeLinecap="round" />
    <Path d="M 42 64 L 44 71" stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} strokeLinecap="round" />

    {/* Thought Bubble */}
    <Path d="M 68 28 C 68 22, 74 18, 80 20 C 86 18, 92 22, 92 28 C 94 34, 90 38, 84 38 C 78 38, 74 36, 68 28 Z" fill="#FAF9F7" stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} />
    <Circle cx={62} cy={34} r={3} fill="#FAF9F7" stroke={COLOR_DEEP_BROWN} strokeWidth={1} />
    <Circle cx={56} cy={38} r={1.5} fill="#FAF9F7" stroke={COLOR_DEEP_BROWN} strokeWidth={1} />

    {/* Bulb */}
    <Circle cx={80} cy={26} r={4} fill={COLOR_ACCENT_BROWN} stroke={COLOR_DEEP_BROWN} strokeWidth={1} />
    <Path d="M 78 30 L 82 30" stroke={COLOR_DEEP_BROWN} strokeWidth={1} />
    <Line x1={80} y1={22} x2={80} y2={20} stroke={COLOR_DEEP_BROWN} strokeWidth={0.8} />

    {/* Plant Sprout */}
    <Path d="M 85 72 Q 88 64 92 70" fill="none" stroke={COLOR_FOREST_GREEN} strokeWidth={1.2} />
    <Circle cx={88} cy={64} r={1.5} fill={COLOR_FOREST_GREEN} />
  </Svg>
);

export const InsightMascotIllustration = React.memo(InsightMascotIllustrationBase);
export default InsightMascotIllustration;
