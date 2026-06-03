import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/providers/theme-provider';
import { borderRadius } from '@/theme';

export function SkeletonPlaceholder({
  width: w = '100%',
  height: h = 20,
  style,
}: {
  width?: number | string;
  height?: number;
  style?: any;
}) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 650 }),
        withTiming(0.3, { duration: 650 })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const resolvedWidth = typeof w === 'number' ? w : w;

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: resolvedWidth as any,
          height: h,
          backgroundColor: theme.surfaceElevated,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function TransactionSkeleton() {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      {[1, 2, 3].map((key) => (
        <View key={key} style={[styles.row, { borderBottomColor: theme.border }]}>
          <SkeletonPlaceholder width={44} height={44} style={styles.iconPlaceholder} />
          <View style={styles.infoCol}>
            <SkeletonPlaceholder width="60%" height={16} style={styles.linePlaceholder} />
            <SkeletonPlaceholder width="40%" height={12} style={styles.linePlaceholder} />
          </View>
          <View style={styles.rightCol}>
            <SkeletonPlaceholder width={60} height={18} style={styles.linePlaceholder} />
            <SkeletonPlaceholder width={40} height={10} style={styles.linePlaceholder} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    borderRadius: 4,
  },
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  iconPlaceholder: {
    borderRadius: 12,
  },
  infoCol: {
    flex: 1,
    gap: 6,
  },
  linePlaceholder: {
    borderRadius: 4,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
});
