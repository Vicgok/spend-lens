import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View, ViewStyle } from 'react-native';
import { LineChart } from 'react-native-chart-kit/v2';
import { Circle } from 'react-native-svg';
import { typography, tokens } from '@/theme';

export interface AreaTrendChartDatum {
  key: string;
  label: string;
  value: number;
}

interface AreaTrendChartProps {
  data: AreaTrendChartDatum[];
  style?: ViewStyle;
  height?: number;
  selectedKey?: string | null;
  onSelectKey?: (key: string) => void;
}

const DEFAULT_HEIGHT = 210;
const HORIZONTAL_PADDING = 10;
const CHART_MIN_WIDTH = 220;

export default function AreaTrendChart({
  data,
  style,
  height = DEFAULT_HEIGHT,
  selectedKey = null,
  onSelectKey,
}: AreaTrendChartProps) {
  const [viewportWidth, setViewportWidth] = useState(0);

  const normalizedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      value: Math.max(0, item.value || 0),
    }));
  }, [data]);

  const labelByKey = useMemo(() => {
    return new Map(normalizedData.map((item) => [item.key, item.label]));
  }, [normalizedData]);

  const chartWidth = Math.max(viewportWidth, CHART_MIN_WIDTH);

  const maxValue = useMemo(() => {
    const largest = normalizedData.reduce((highest, item) => Math.max(highest, item.value), 0);
    if (largest <= 0) return 1000;
    if (largest <= 1000) return 1000;
    return Math.ceil(largest / 250) * 250;
  }, [normalizedData]);

  const selectedIndex = useMemo(() => {
    if (!selectedKey) return normalizedData.length > 0 ? normalizedData.length - 1 : undefined;
    const foundIndex = normalizedData.findIndex((item) => item.key === selectedKey);
    return foundIndex >= 0 ? foundIndex : normalizedData.length > 0 ? normalizedData.length - 1 : undefined;
  }, [normalizedData, selectedKey]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.floor(event.nativeEvent.layout.width);
    setViewportWidth((current) => (current === nextWidth ? current : nextWidth));
  };

  const isReady = viewportWidth > 0;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.viewport} onLayout={handleLayout}>
        {isReady ? (
          <LineChart
            data={normalizedData}
            xKey="key"
            yKey="value"
            width={chartWidth}
            height={height}
            yDomain={[0, maxValue]}
            yAxisLabelWidth={34}
            showHorizontalGridLines
            showVerticalGridLines={false}
            showDots={false}
            area
            areaFill={{
              fromColor: tokens.colors.forest,
              toColor: tokens.colors.forest,
              fromOpacity: 0.14,
              toOpacity: 0.02,
            }}
            selectedIndex={selectedIndex}
            interaction={{
              mode: 'tap',
              onSelect: (event) => {
                const raw = event.raw as AreaTrendChartDatum | undefined;
                if (raw?.key) {
                  onSelectKey?.(raw.key);
                }
              },
            }}
            tooltip={false}
            curve="monotone"
            series={[
              {
                yKey: 'value',
                color: tokens.colors.forest,
                strokeWidth: 4,
                area: true,
                areaFill: {
                  fromColor: tokens.colors.forest,
                  toColor: tokens.colors.forest,
                  fromOpacity: 0.14,
                  toOpacity: 0.02,
                },
              },
            ]}
            renderActiveDot={({ x, y }) => (
              <>
                <Circle cx={x} cy={y} r={8} fill="rgba(183, 136, 78, 0.18)" />
                <Circle cx={x} cy={y} r={5} fill={tokens.colors.tactileAccentBrown} />
                <Circle cx={x} cy={y} r={2.5} fill={tokens.colors.surface} />
              </>
            )}
            formatXLabel={(value) => labelByKey.get(String(value)) ?? String(value)}
            formatYLabel={(value) => `${Math.round(value)}`}
            theme={{
              background: tokens.colors.surface,
              plotBackground: tokens.colors.surface,
              grid: tokens.colors.tactileBorder,
              axis: tokens.colors.tactileMuted,
              text: tokens.colors.textSecondary,
              mutedText: tokens.colors.tactileMuted,
              series: [tokens.colors.forest],
              typography: {
                fontFamily: typography.fontFamily.medium,
                axisLabelSize: 11,
              },
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: tokens.colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 8,
    paddingBottom: 6,
  },
  viewport: {
    width: '100%',
    overflow: 'hidden',
  },
});
