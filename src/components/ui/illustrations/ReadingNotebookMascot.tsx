import React from 'react';
import Svg, { G, Rect, Circle, Path, Ellipse } from 'react-native-svg';
import { sheetColors as colors } from '@/theme';

type Props = { width?: number; height?: number };

// Friendly cream notebook mascot reading a green book and holding a pencil,
// surrounded by small leaves. Children's editorial illustration style.
const NotebookMascotBase: React.FC<Props> = ({ width = 150, height = 130 }) => (
  <Svg width={width} height={height} viewBox="0 0 150 130" fill="none">
    {/* Soft cream cloud behind */}
    <Ellipse cx={85} cy={95} rx={62} ry={16} fill={colors.notebookCream} opacity={0.55} />

    {/* Leaves at base — left cluster */}
    <G>
      <Path d="M22 100c2-10 8-16 16-18-1 10-6 16-16 18z" fill={colors.leafFill} stroke={colors.leafStroke} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M30 102c0-7 4-12 10-13" stroke={colors.leafStroke} strokeWidth={1} strokeLinecap="round" />
      <Path d="M38 104c1-6 5-10 11-11-1 7-5 10-11 11z" fill={colors.leafFill} stroke={colors.leafStroke} strokeWidth={1.2} strokeLinejoin="round" />
    </G>

    {/* Notebook body */}
    <G>
      <Rect x={48} y={26} width={70} height={70} rx={10} fill={colors.notebookCream} stroke={colors.illoOutline} strokeWidth={1.6} />
      {/* Spiral rings on left edge */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <Circle key={i} cx={48} cy={34 + i * 11} r={2.4} fill={colors.notebookCream} stroke={colors.illoOutline} strokeWidth={1.2} />
      ))}
      {/* Face */}
      <Circle cx={73} cy={56} r={2.2} fill={colors.illoFace} />
      <Circle cx={93} cy={56} r={2.2} fill={colors.illoFace} />
      <Path d="M76 66c2 2.4 5 3.6 8 3.6s6-1.2 8-3.6" stroke={colors.illoFace} strokeWidth={1.6} strokeLinecap="round" fill="none" />
    </G>

    {/* Green book held in front */}
    <G>
      <Rect x={62} y={70} width={44} height={28} rx={3} fill={colors.forestSoft} stroke={colors.forest} strokeWidth={1.4} />
      <Path d="M84 70v28" stroke={colors.forest} strokeWidth={1.4} />
      <Path d="M68 78h12M68 84h12M92 78h10M92 84h10" stroke={colors.notebookCream} strokeWidth={1} strokeLinecap="round" opacity={0.7} />
    </G>

    {/* Arms — thin brown strokes from notebook to book */}
    <Path d="M55 78c2 4 5 6 9 6" stroke={colors.illoOutline} strokeWidth={1.6} strokeLinecap="round" fill="none" />
    <Path d="M111 78c-2 4-5 6-9 6" stroke={colors.illoOutline} strokeWidth={1.6} strokeLinecap="round" fill="none" />

    {/* Pencil in right hand */}
    <G>
      <Rect x={110} y={62} width={26} height={6} rx={1.4} transform="rotate(28 110 62)" fill={colors.pencilWood} stroke={colors.illoOutline} strokeWidth={1.2} />
      <Path d="M133.5 74.5l5 2.6-2 4.6-5-2.6z" fill={colors.illoFace} stroke={colors.illoOutline} strokeWidth={1} />
      <Rect x={106} y={60} width={6} height={6} rx={1.2} transform="rotate(28 106 60)" fill={colors.pencilEraser} stroke={colors.illoOutline} strokeWidth={1} />
    </G>

    {/* Right side small leaf */}
    <Path d="M128 96c-1-7-5-11-11-12 1 7 5 11 11 12z" fill={colors.leafFill} stroke={colors.leafStroke} strokeWidth={1.2} strokeLinejoin="round" />
  </Svg>
);

export const NotebookMascot = React.memo(NotebookMascotBase);
export const ReadingNotebookMascot = NotebookMascot;
export default ReadingNotebookMascot;
