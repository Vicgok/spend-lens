import React from 'react';
import Svg, {
  Ellipse,
  Path,
} from 'react-native-svg';

export const LeafCluster = React.memo(() => (
  <Svg width={60} height={70} viewBox="0 0 60 70">

    <Path
      d="M30 65 C30 45 30 30 30 10"
      stroke="#8C9168"
      strokeWidth="2"
      strokeLinecap="round"
    />

    <Ellipse
      cx="22"
      cy="18"
      rx="5"
      ry="10"
      fill="#D4D0A1"
      stroke="#9B966A"
    />

    <Ellipse
      cx="38"
      cy="28"
      rx="5"
      ry="10"
      fill="#D4D0A1"
      stroke="#9B966A"
    />

    <Ellipse
      cx="22"
      cy="40"
      rx="5"
      ry="10"
      fill="#D4D0A1"
      stroke="#9B966A"
    />

    <Ellipse
      cx="38"
      cy="50"
      rx="5"
      ry="10"
      fill="#D4D0A1"
      stroke="#9B966A"
    />

  </Svg>
));

export default LeafCluster;
