import React from 'react';
import Svg, { Path, Ellipse } from 'react-native-svg';
import { useTheme } from '@/providers/theme-provider';

const CornerPlantBase: React.FC<{ width?: number; height?: number }> = ({ width = 80, height = 60 }) => {
  const { theme: colors } = useTheme();
  return (
    <Svg width={width} height={height} viewBox="0 0 80 60" fill="none">
      {/* Ground pebble */}
      <Ellipse cx={40} cy={52} rx={18} ry={4} fill={colors.ground} />
      {/* Stems */}
      <Path d="M40 52c-2-10-6-18-12-22" stroke={colors.leafStroke} strokeWidth={1.2} strokeLinecap="round" fill="none" />
      <Path d="M40 52c0-12 2-22 6-28" stroke={colors.leafStroke} strokeWidth={1.2} strokeLinecap="round" fill="none" />
      <Path d="M40 52c3-8 8-14 14-16" stroke={colors.leafStroke} strokeWidth={1.2} strokeLinecap="round" fill="none" />
      {/* Leaves */}
      <Path d="M28 30c-6 0-10-4-10-10 6 0 10 4 10 10z" fill={colors.leafFill} stroke={colors.leafStroke} strokeWidth={1.1} strokeLinejoin="round" />
      <Path d="M46 24c0-7 4-12 10-12 0 7-4 12-10 12z" fill={colors.leafFill} stroke={colors.leafStroke} strokeWidth={1.1} strokeLinejoin="round" />
      <Path d="M54 36c5-2 9-1 12 2-4 3-9 3-12-2z" fill={colors.leafFill} stroke={colors.leafStroke} strokeWidth={1.1} strokeLinejoin="round" />
      <Path d="M42 18c-1-6 1-11 5-13 2 6 0 11-5 13z" fill={colors.leafFill} stroke={colors.leafStroke} strokeWidth={1.1} strokeLinejoin="round" />
    </Svg>
  );
};

export const CornerPlant = React.memo(CornerPlantBase);

export default CornerPlant;
