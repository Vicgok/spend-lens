import React, { useEffect, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  Easing,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/providers/theme-provider';
import { tokens } from '@/theme';


export function SkeletonPlaceholder({
  width: w = '100%',
  height: h = 20,
  style,
  baseColor,
  shimmerColor,
}: {
  width?: number | string;
  height?: number;
  style?: any;
  baseColor?: string;
  shimmerColor?: string;
}) {
  const { theme } = useTheme();
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const shimmerX = useSharedValue(-140);

  useEffect(() => {
    if (measuredWidth <= 0) {
      return;
    }

    shimmerX.value = -140;
    shimmerX.value = withRepeat(
      withTiming(measuredWidth + 140, {
        duration: 1100,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [measuredWidth, shimmerX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0 && nextWidth !== measuredWidth) {
      setMeasuredWidth(nextWidth);
    }
  };

  const resolvedWidth = typeof w === 'number' ? w : w;

  return (
    <View
      style={[
        {
          width: resolvedWidth as any,
          height: h,
        },
        style,
      ]}
      onLayout={handleLayout}
    >
      <View
        style={[
          styles.skeleton,
          {
            backgroundColor: baseColor ?? theme.surfaceElevated,
          },
        ]}
      >
        {measuredWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shimmerStrip,
              {
                backgroundColor: shimmerColor ?? theme.card,
              },
              shimmerStyle,
            ]}
          />
        ) : null}
      </View>
    </View>
  );
}

export function TransactionSkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3].map((key) => (
        <View key={key} style={[styles.row, { borderBottomColor: tokens.colors.tactileBorder }]}>
          <SkeletonPlaceholder
            width={44}
            height={44}
            style={styles.iconPlaceholder}
            baseColor={tokens.colors.tactileCardMiddle}
            shimmerColor="rgba(255,255,255,0.72)"
          />
          <View style={styles.infoCol}>
            <SkeletonPlaceholder
              width="60%"
              height={16}
              style={styles.linePlaceholder}
              baseColor={tokens.colors.tactileCardMiddle}
              shimmerColor="rgba(255,255,255,0.72)"
            />
            <SkeletonPlaceholder
              width="40%"
              height={12}
              style={styles.linePlaceholder}
              baseColor={tokens.colors.tactileCardMiddle}
              shimmerColor="rgba(255,255,255,0.72)"
            />
          </View>
          <View style={styles.rightCol}>
            <SkeletonPlaceholder
              width={60}
              height={18}
              style={styles.linePlaceholder}
              baseColor={tokens.colors.tactileCardMiddle}
              shimmerColor="rgba(255,255,255,0.72)"
            />
            <SkeletonPlaceholder
              width={40}
              height={10}
              style={styles.linePlaceholder}
              baseColor={tokens.colors.tactileCardMiddle}
              shimmerColor="rgba(255,255,255,0.72)"
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export function HistorySkeleton() {
  return (
    <View style={styles.historyContainer}>
      <View
        style={[
          styles.historyCard,
          { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.tactileBorder },
        ]}
      >
        <SkeletonPlaceholder
          width={140}
          height={18}
          style={styles.historyTitle}
          baseColor={tokens.colors.tactileCardMiddle}
          shimmerColor="rgba(255,255,255,0.72)"
        />
        <View style={styles.historyStatsRow}>
          {[1, 2, 3].map((key, index) => (
            <View
              key={key}
              style={[
                styles.historyStatCol,
                index > 0 && { borderLeftWidth: 1, borderLeftColor: tokens.colors.tactileBorder },
              ]}
            >
              <SkeletonPlaceholder
                width={56}
                height={10}
                style={styles.historyStatLabel}
                baseColor={tokens.colors.tactileCardMiddle}
                shimmerColor="rgba(255,255,255,0.72)"
              />
              <SkeletonPlaceholder
                width={74}
                height={20}
                baseColor={tokens.colors.tactileCardMiddle}
                shimmerColor="rgba(255,255,255,0.72)"
              />
            </View>
          ))}
        </View>
      </View>

      <View
        style={[
          styles.historyCard,
          { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.tactileBorder },
        ]}
      >
        <SkeletonPlaceholder
          width={124}
          height={18}
          style={styles.historyTitle}
          baseColor={tokens.colors.tactileCardMiddle}
          shimmerColor="rgba(255,255,255,0.72)"
        />
        <SkeletonPlaceholder
          width="52%"
          height={12}
          style={styles.historySubtitle}
          baseColor={tokens.colors.tactileCardMiddle}
          shimmerColor="rgba(255,255,255,0.72)"
        />
        <View style={styles.historyModeRow}>
          {[1, 2, 3, 4].map((key) => (
            <SkeletonPlaceholder
              key={key}
              width={52}
              height={28}
              style={styles.historyModePill}
              baseColor={tokens.colors.tactileCardMiddle}
              shimmerColor="rgba(255,255,255,0.72)"
            />
          ))}
        </View>
        <View style={styles.historyChartArea}>
          {[1, 2, 3, 4, 5, 6, 7].map((key) => (
            <SkeletonPlaceholder
              key={key}
              width={18}
              height={60 + (key % 4) * 18}
              style={styles.historyChartBar}
              baseColor={tokens.colors.tactileCardMiddle}
              shimmerColor="rgba(255,255,255,0.72)"
            />
          ))}
        </View>
        <View
          style={[
            styles.historyDetailCard,
            { backgroundColor: tokens.colors.tactileCardMiddle, borderColor: tokens.colors.tactileBorder },
          ]}
        >
          <SkeletonPlaceholder
            width={120}
            height={14}
            style={styles.historyTitle}
            baseColor={tokens.colors.tactileCardBack}
            shimmerColor="rgba(255,255,255,0.68)"
          />
          <SkeletonPlaceholder
            width="72%"
            height={12}
            style={styles.historySubtitle}
            baseColor={tokens.colors.tactileCardBack}
            shimmerColor="rgba(255,255,255,0.68)"
          />
          <SkeletonPlaceholder
            width={96}
            height={12}
            baseColor={tokens.colors.tactileCardBack}
            shimmerColor="rgba(255,255,255,0.68)"
          />
        </View>
      </View>

      <TransactionSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  shimmerStrip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 72,
    opacity: 0.42,
    borderRadius: 999,
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
  historyContainer: {
    width: '100%',
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  historyTitle: {
    marginBottom: 12,
  },
  historySubtitle: {
    marginBottom: 12,
  },
  historyStatsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  historyStatCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  historyStatLabel: {
    marginBottom: 2,
  },
  historyModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  historyModePill: {
    borderRadius: 12,
  },
  historyChartArea: {
    height: 210,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 16,
    marginBottom: 16,
  },
  historyChartBar: {
    borderRadius: 999,
    alignSelf: 'flex-end',
  },
  historyDetailCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
});
