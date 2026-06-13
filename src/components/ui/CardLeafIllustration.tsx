import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';

const LEAF_FILL = '#D8D4A8';
const LEAF_STROKE = '#9B9469';
const STEM = '#6E7B4B';
const GROUND = '#DDD3C6';

const CardLeafIllustrationBase = () => (
  <View style={{ position: 'absolute', right: 24, bottom: 0, opacity: 0.25, zIndex: 0 }} pointerEvents="none">
    <Svg width={65} height={48} viewBox="0 0 65 48" fill="none">
      {/* Stem */}
      <Path
        d="M54 47C54 36 53 27 55 18C56 13 58 9 61 5"
        stroke={STEM}
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      {/* Small Left Leaf */}
      <Ellipse
        cx="50"
        cy="26"
        rx="4"
        ry="8"
        transform="rotate(-35 50 26)"
        fill={LEAF_FILL}
        stroke={LEAF_STROKE}
        strokeWidth={1}
      />

      {/* Large Center Leaf */}
      <Ellipse
        cx="56"
        cy="16"
        rx="5.5"
        ry="12"
        transform="rotate(15 56 16)"
        fill={LEAF_FILL}
        stroke={LEAF_STROKE}
        strokeWidth={1}
      />

      {/* Right Leaf */}
      <Ellipse
        cx="63"
        cy="23"
        rx="4"
        ry="9"
        transform="rotate(28 63 23)"
        fill={LEAF_FILL}
        stroke={LEAF_STROKE}
        strokeWidth={1}
      />

      {/* Ground */}
      <Path
        d="M40 47H65"
        stroke={GROUND}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

export const CardLeafIllustration = React.memo(CardLeafIllustrationBase);
export default CardLeafIllustration;
