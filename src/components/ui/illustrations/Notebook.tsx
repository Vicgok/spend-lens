import React from 'react';
import Svg, { Rect, Circle, Line, Path } from 'react-native-svg';
import { tokens } from '@/theme';

const COLOR_FOREST_GREEN = tokens.colors.forest;
const COLOR_DEEP_BROWN = tokens.colors.textPrimary;

const NotebookIllustrationBase = () => (
  <Svg width={72} height={72} viewBox="0 0 80 80">
    <Rect x={10} y={15} width={60} height={52} rx={6} fill="#FAF9F7" stroke={COLOR_DEEP_BROWN} strokeWidth={1.5} />
    {/* Page rings */}
    <Circle cx={24} cy={15} r={2.5} fill="#B7884E" stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} />
    <Circle cx={40} cy={15} r={2.5} fill="#B7884E" stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} />
    <Circle cx={56} cy={15} r={2.5} fill="#B7884E" stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} />
    {/* Page writing guidelines */}
    <Line x1={18} y1={28} x2={62} y2={28} stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} opacity={0.4} />
    <Line x1={18} y1={36} x2={58} y2={36} stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} opacity={0.4} />
    <Line x1={18} y1={44} x2={52} y2={44} stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} opacity={0.4} />
    <Line x1={18} y1={52} x2={60} y2={52} stroke={COLOR_DEEP_BROWN} strokeWidth={1.2} opacity={0.4} />
    {/* Little plant accents inside notebook */}
    <Path d="M 58 58 Q 62 50 64 60" fill="none" stroke={COLOR_FOREST_GREEN} strokeWidth={1.2} />
    <Circle cx={62} cy={50} r={1.5} fill={COLOR_FOREST_GREEN} />
  </Svg>
);

export const NotebookIllustration = React.memo(NotebookIllustrationBase);
export default NotebookIllustration;
