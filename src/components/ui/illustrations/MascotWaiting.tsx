import React from 'react';
import Svg, { Rect, Circle, Line, Path } from 'react-native-svg';
import { tokens } from '@/theme';

const COLOR_FOREST_GREEN = tokens.colors.forest;
const COLOR_DEEP_BROWN = tokens.colors.textPrimary;

const MascotWaitingBase = () => (
  <Svg width={72} height={72} viewBox="0 0 80 80">
    {/* Clipboard */}
    <Rect x={10} y={15} width={34} height={48} rx={4} fill="#FAF9F7" stroke={COLOR_DEEP_BROWN} strokeWidth={1.5} />
    <Rect x={22} y={11} width={10} height={5} rx={1} fill="#D4A373" stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} />
    <Line x1={16} y1={26} x2={38} y2={26} stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} opacity={0.6} />
    <Line x1={16} y1={33} x2={34} y2={33} stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} opacity={0.6} />
    <Line x1={16} y1={40} x2={30} y2={40} stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} opacity={0.6} />
    <Line x1={16} y1={47} x2={36} y2={47} stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} opacity={0.6} />

    <Circle cx={14} cy={26} r={1.5} fill={COLOR_FOREST_GREEN} />
    <Circle cx={14} cy={33} r={1.5} fill={COLOR_FOREST_GREEN} />
    <Circle cx={14} cy={40} r={1.5} fill={COLOR_FOREST_GREEN} />
    <Circle cx={14} cy={47} r={1.5} fill={COLOR_FOREST_GREEN} />

    {/* Mascot */}
    <Circle cx={52} cy={46} r={18} fill="#FAF9F7" stroke={COLOR_DEEP_BROWN} strokeWidth={1.8} />
    <Circle cx={52} cy={46} r={15} fill="rgba(62, 90, 42, 0.05)" />

    {/* Face */}
    <Circle cx={46} cy={44} r={2.2} fill={COLOR_DEEP_BROWN} />
    <Circle cx={58} cy={44} r={2.2} fill={COLOR_DEEP_BROWN} />
    <Circle cx={41} cy={47} r={1.8} fill={COLOR_FOREST_GREEN} opacity={0.3} />
    <Circle cx={63} cy={47} r={1.8} fill={COLOR_FOREST_GREEN} opacity={0.3} />
    <Path d="M 49 49 Q 52 52 55 49" stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} strokeLinecap="round" fill="none" />

    {/* Antenna */}
    <Path d="M 52 28 L 52 24" stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} />
    <Circle cx={52} cy={22} r={2.5} fill={COLOR_FOREST_GREEN} stroke={COLOR_DEEP_BROWN} strokeWidth={1} />

    {/* Legs & Arm */}
    <Path d="M 47 64 L 45 71" stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} strokeLinecap="round" />
    <Path d="M 57 64 L 59 71" stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} strokeLinecap="round" />
    <Path d="M 38 48 Q 42 46 45 48" fill="none" stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} strokeLinecap="round" />

    {/* Tiny plant */}
    <Path d="M 8 72 Q 12 66 10 74" fill="none" stroke={COLOR_FOREST_GREEN} strokeWidth={1.2} />
    <Circle cx={12} cy={66} r={1.5} fill={COLOR_FOREST_GREEN} />
  </Svg>
);

export const MascotWaiting = React.memo(MascotWaitingBase);
export default MascotWaiting;
