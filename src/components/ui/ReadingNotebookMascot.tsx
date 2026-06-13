import React from 'react';
import Svg, {
  Rect,
  Circle,
  Path,
  Line,
} from 'react-native-svg';

export const ReadingNotebookMascot = React.memo(() => (
  <Svg width={140} height={110} viewBox="0 0 140 110">

    <Rect
      x="35"
      y="12"
      width="50"
      height="60"
      rx="8"
      fill="#F5E9D8"
      stroke="#9B7B5B"
      strokeWidth="2"
    />

    {/* Glasses */}
    <Circle
      cx="50"
      cy="38"
      r="7"
      stroke="#9B7B5B"
      strokeWidth="2"
      fill="none"
    />

    <Circle
      cx="70"
      cy="38"
      r="7"
      stroke="#9B7B5B"
      strokeWidth="2"
      fill="none"
    />

    <Line
      x1="57"
      y1="38"
      x2="63"
      y2="38"
      stroke="#9B7B5B"
      strokeWidth="2"
    />

    {/* Book */}
    <Path
      d="M20 58 L55 50 L55 95 L20 85 Z"
      fill="#4F6D3A"
    />

    <Path
      d="M55 50 L95 58 L95 95 L55 95 Z"
      fill="#3E5A2A"
    />

    {/* Smile */}
    <Path
      d="M50 52 Q60 58 70 52"
      stroke="#5B4333"
      strokeWidth="2"
      fill="none"
    />
  </Svg>
));

export default ReadingNotebookMascot;
