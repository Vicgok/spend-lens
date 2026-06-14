import React from 'react';
import Svg, {
  G,
  Circle,
  Ellipse,
  Path,
  Rect,
  Defs,
  ClipPath,
} from 'react-native-svg';
import { tokens } from '@/theme';

const colors = tokens.colors;


type Props = {
  width?: number;
  height?: number;
};

const SproutCoinMascotBase: React.FC<Props> = ({
  width = 220,
  height = 160,
}) => (
  <Svg width={width} height={height} viewBox="0 0 220 160" fill="none">
    {/* Soft ground halo */}
    <Ellipse cx={110} cy={130} rx={92} ry={12} fill={colors.sproutGround} opacity={0.7} />

    {/* Left ground leaves */}
    <G>
      <Path
        d="M22 132c2-12 10-19 22-20-1 12-9 19-22 20z"
        fill={colors.sproutLeafFill}
        stroke={colors.sproutLeafStroke}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Path
        d="M30 132c1-9 6-14 14-15"
        stroke={colors.sproutLeafStroke}
        strokeWidth={1}
        strokeLinecap="round"
      />
      <Path
        d="M44 134c1-8 7-13 16-14-2 9-7 13-16 14z"
        fill={colors.sproutLeafFill}
        stroke={colors.sproutLeafStroke}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </G>

    {/* Right ground leaves */}
    <G>
      <Path
        d="M198 132c-2-12-10-19-22-20 1 12 9 19 22 20z"
        fill={colors.sproutLeafFill}
        stroke={colors.sproutLeafStroke}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Path
        d="M190 132c-1-9-6-14-14-15"
        stroke={colors.sproutLeafStroke}
        strokeWidth={1}
        strokeLinecap="round"
      />
      <Path
        d="M176 134c-1-8-7-13-16-14 2 9 7 13 16 14z"
        fill={colors.sproutLeafFill}
        stroke={colors.sproutLeafStroke}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </G>

    {/* Sparkles */}
    <G fill={colors.sproutSparkle} opacity={0.85}>
      <Path d="M44 44l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
      <Path d="M178 38l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" />
      <Path d="M196 78l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" />
      <Circle cx={32} cy={86} r={1.6} />
      <Circle cx={188} cy={108} r={1.6} />
    </G>

    {/* Twig held in left hand */}
    <G>
      <Path
        d="M70 110 L58 86"
        stroke={colors.sproutTwig}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      {/* small leaf on twig */}
      <Path
        d="M58 86c-4-2-6-6-5-10 4 0 8 3 9 7l-4 3z"
        fill={colors.sproutLeafFill}
        stroke={colors.sproutLeafStroke}
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    </G>

    {/* Sprout leaf on top of head */}
    <G>
      <Path
        d="M110 30c-10-4-16-14-14-26 12 0 22 10 22 22l-8 4z"
        fill={colors.sproutLeafFill}
        stroke={colors.sproutLeafStroke}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M99 8c5 6 10 13 13 22"
        stroke={colors.sproutLeafStroke}
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
      />
    </G>

    {/* Body — round coin */}
    <G>
      <Circle
        cx={110}
        cy={82}
        r={42}
        fill={colors.sproutBodyFill}
        stroke={colors.sproutBodyStroke}
        strokeWidth={2}
      />
      {/* subtle inner rim to suggest a coin */}
      <Circle
        cx={110}
        cy={82}
        r={36}
        fill="none"
        stroke={colors.sproutBodyStroke}
        strokeWidth={1}
        opacity={0.45}
      />

      {/* Cheeks */}
      <Ellipse cx={94} cy={88} rx={4} ry={2.4} fill={colors.sproutCheek} opacity={0.75} />
      <Ellipse cx={126} cy={88} rx={4} ry={2.4} fill={colors.sproutCheek} opacity={0.75} />

      {/* Eyes */}
      <Circle cx={100} cy={80} r={2.4} fill={colors.sproutFace} />
      <Circle cx={120} cy={80} r={2.4} fill={colors.sproutFace} />

      {/* Smile */}
      <Path
        d="M104 92c2 2.4 4 3.6 6 3.6s4-1.2 6-3.6"
        stroke={colors.sproutFace}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
    </G>

    {/* Arms (thin outlines) */}
    <Path
      d="M74 96c-2 4-3 8-3 14"
      stroke={colors.sproutBodyStroke}
      strokeWidth={1.8}
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M146 96c2 4 3 8 3 14"
      stroke={colors.sproutBodyStroke}
      strokeWidth={1.8}
      strokeLinecap="round"
      fill="none"
    />

    {/* Tiny feet */}
    <Ellipse cx={96} cy={126} rx={6} ry={3} fill={colors.sproutBodyStroke} opacity={0.55} />
    <Ellipse cx={124} cy={126} rx={6} ry={3} fill={colors.sproutBodyStroke} opacity={0.55} />
  </Svg>
);

export const SproutCoinMascot = React.memo(SproutCoinMascotBase);
export default SproutCoinMascot;
