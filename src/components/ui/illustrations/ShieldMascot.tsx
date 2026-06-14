import React from 'react';
import Svg, { Path, G } from 'react-native-svg';
import { useTheme } from '@/providers/theme-provider';

type Props = { width?: number; height?: number };

// Shield mascot with a green checkmark and leafy base.
// Warm editorial illustration style matching the SpendLens family.
const ShieldMascotBase: React.FC<Props> = ({ width = 120, height = 120 }) => {
    const { theme: colors } = useTheme();
    return (
        <Svg width={width} height={height} viewBox="0 0 120 120" fill="none">
            {/* Shield body */}
            <G>
                <Path
                    d="M28 20c0-5 5-10 15-10h34c10 0 15 5 15 10v38c0 18-14 32-32 40-18-8-32-22-32-40V20z"
                    fill={colors.notebookCream}
                    stroke={colors.illoOutline}
                    strokeWidth={1.8}
                    strokeLinejoin="round"
                />
                {/* Inner highlight line for depth */}
                <Path
                    d="M34 24c0-3 3-6 10-6h28c7 0 10 3 10 6v32c0 14-11 26-24 32-13-6-24-18-24-32V24z"
                    fill="none"
                    stroke={colors.notebookCream}
                    strokeWidth={1.2}
                    strokeLinejoin="round"
                    opacity={0.6}
                />
            </G>

            {/* Green checkmark */}
            <G>
                <Path
                    d="M42 52l10 12 22-24"
                    stroke={colors.forest}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />
                {/* Subtle checkmark shadow/highlight */}
                <Path
                    d="M42 54l10 12 22-24"
                    stroke={colors.leafLight}
                    strokeWidth={1.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity={0.5}
                />
            </G>

            {/* Leafy plants at base */}
            <G>
                {/* Left stem */}
                <Path
                    d="M36 102c-2-8-6-14-12-18"
                    stroke={colors.leafStroke}
                    strokeWidth={1.2}
                    strokeLinecap="round"
                    fill="none"
                />
                {/* Right stem */}
                <Path
                    d="M84 102c2-8 6-14 12-18"
                    stroke={colors.leafStroke}
                    strokeWidth={1.2}
                    strokeLinecap="round"
                    fill="none"
                />
                {/* Center stem */}
                <Path
                    d="M60 102c0-6 2-12 4-16"
                    stroke={colors.leafStroke}
                    strokeWidth={1.2}
                    strokeLinecap="round"
                    fill="none"
                />

                {/* Left leaves */}
                <Path
                    d="M24 84c-6 0-10-4-10-10 6 0 10 4 10 10z"
                    fill={colors.leafFill}
                    stroke={colors.leafStroke}
                    strokeWidth={1.1}
                    strokeLinejoin="round"
                />
                <Path
                    d="M32 90c0-6 4-10 10-10-1 6-5 10-10 10z"
                    fill={colors.leafFill}
                    stroke={colors.leafStroke}
                    strokeWidth={1.1}
                    strokeLinejoin="round"
                />

                {/* Right leaves */}
                <Path
                    d="M96 84c6 0 10-4 10-10-6 0-10 4-10 10z"
                    fill={colors.leafFill}
                    stroke={colors.leafStroke}
                    strokeWidth={1.1}
                    strokeLinejoin="round"
                />
                <Path
                    d="M88 90c0-6-4-10-10-10 1 6 5 10 10 10z"
                    fill={colors.leafFill}
                    stroke={colors.leafStroke}
                    strokeWidth={1.1}
                    strokeLinejoin="round"
                />

                {/* Center small leaf */}
                <Path
                    d="M60 86c-4-1-6-5-6-9 4 1 6 5 6 9z"
                    fill={colors.leafFill}
                    stroke={colors.leafStroke}
                    strokeWidth={1.1}
                    strokeLinejoin="round"
                />
            </G>
        </Svg>
    );
};

export const ShieldMascotIllustration = React.memo(ShieldMascotBase);

export default ShieldMascotIllustration;