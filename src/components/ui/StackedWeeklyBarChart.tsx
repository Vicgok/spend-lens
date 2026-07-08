import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BarChart } from 'react-native-chart-kit/v2';
import { G, Rect } from 'react-native-svg';
import { typography, tokens } from '@/theme';

export interface StackedWeeklyBarChartDatum {
  label: string;
  value: number;
  target: number;
}

interface StackedWeeklyBarChartProps {
  data: StackedWeeklyBarChartDatum[];
  style?: ViewStyle;
  height?: number;
  selectedIndex?: number | null;
  onSelectIndex?: (index: number) => void;
}

const DEFAULT_HEIGHT = 250;
const CARD_HORIZONTAL_PADDING = 10;
const CARD_VERTICAL_PADDING = 10;
const CHART_CONTENT_MIN_WIDTH = 220;
const TARGET_FILL = '#D9E7D2';
const PRIMARY_FILL = tokens.colors.forest;
const SECONDARY_FILL = '#A0C42C';
const SURFACE_FILL = tokens.colors.surface;
const GRID_COLOR = tokens.colors.tactileBorder;
const AXIS_COLOR = tokens.colors.tactileMuted;
const TEXT_COLOR = tokens.colors.textSecondary;
const MUTED_TEXT_COLOR = tokens.colors.tactileMuted;

export default function StackedWeeklyBarChart({
  data,
  style,
  height = DEFAULT_HEIGHT,
  selectedIndex = null,
  onSelectIndex,
}: StackedWeeklyBarChartProps) {
  const [viewportWidth, setViewportWidth] = useState(0);

  const normalizedData = useMemo(() => {
    return data.slice(0, 7).map((item) => ({
      label: item.label,
      value: Math.max(0, item.value || 0),
      target: Math.max(0, item.target || 0),
    }));
  }, [data]);

  const maxValue = useMemo(() => {
    const largest = normalizedData.reduce((highest, item) => {
      return Math.max(highest, item.value, item.target);
    }, 0);

    if (largest <= 0) {
      return 1000;
    }

    if (largest <= 1000) {
      return 1000;
    }

    return Math.ceil(largest / 250) * 250;
  }, [normalizedData]);

  const chartWidth = Math.max(viewportWidth, CHART_CONTENT_MIN_WIDTH);

  const chartData = useMemo(() => {
    return normalizedData.map((item) => ({
      ...item,
      scaleValue: item.target,
    }));
  }, [normalizedData]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.floor(event.nativeEvent.layout.width);
    setViewportWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
  };

  const isReady = viewportWidth > 0;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.viewport} onLayout={handleLayout}>
        {isReady ? (
          <BarChart
            data={chartData}
            xKey="label"
            yKey="scaleValue"
            width={chartWidth}
            height={height}
            yDomain={[0, maxValue]}
            yTickCount={4}
            barRadius={999}
            barWidthRatio={0.36}
            barGapRatio={0.9}
            showHorizontalGridLines
            showXAxisLabels
            showYAxisLabels
            tooltip={false}
            interaction={{
              mode: 'tap',
              onSelect: (event) => {
                onSelectIndex?.(event.dataIndex);
              },
            }}
            selectedBar={
              selectedIndex !== null
                ? { dataIndex: selectedIndex, seriesKey: 'scaleValue' }
                : undefined
            }
            formatYLabel={(value) => `${Math.round(value)}`}
            formatXLabel={(value) => String(value)}
            renderBar={({ bar, selected }) => {
              const raw = bar.raw as StackedWeeklyBarChartDatum & { scaleValue?: number } | undefined;
              const target = Math.max(0, raw?.target || 0);
              const value = Math.max(0, raw?.value || 0);
              const targetHeight = bar.height;
              const valueHeight = maxValue > 0 ? (value / maxValue) * bar.height : 0;
              const secondaryHeight = valueHeight > 0 ? Math.min(valueHeight * 0.32, valueHeight) : 0;
              const primaryHeight = Math.max(valueHeight - secondaryHeight, 0);
              const radius = Math.min(bar.width / 2, 999);
              const targetY = bar.baselineY - targetHeight;
              const valueY = bar.baselineY - valueHeight;
              const primaryY = bar.baselineY - primaryHeight;
              const highlightInset = selected ? 3 : 0;
              const highlightX = bar.x - highlightInset;
              const highlightWidth = bar.width + highlightInset * 2;
              const highlightY = targetY - highlightInset;
              const highlightHeight = targetHeight + highlightInset * 2;
              const highlightRadius = Math.min(highlightWidth / 2, 999);

              return (
                <G key={bar.key}>
                  {selected ? (
                    <Rect
                      x={highlightX}
                      y={highlightY}
                      width={highlightWidth}
                      height={highlightHeight}
                      rx={highlightRadius}
                      fill="rgba(160, 196, 44, 0.16)"
                      stroke={tokens.colors.forest}
                      strokeWidth={1.5}
                    />
                  ) : null}
                  <Rect
                    x={bar.x}
                    y={targetY}
                    width={bar.width}
                    height={targetHeight}
                    rx={radius}
                    fill={selected ? 'rgba(160, 196, 44, 0.22)' : TARGET_FILL}
                  />
                  {primaryHeight > 0 ? (
                    <Rect
                      x={bar.x}
                      y={primaryY}
                      width={bar.width}
                      height={primaryHeight}
                      rx={radius}
                      fill={selected ? tokens.colors.textPrimary : PRIMARY_FILL}
                    />
                  ) : null}
                  {secondaryHeight > 0 ? (
                    <Rect
                      x={bar.x}
                      y={valueY}
                      width={bar.width}
                      height={secondaryHeight}
                      rx={radius}
                      fill={selected ? tokens.colors.forestSoft : SECONDARY_FILL}
                    />
                  ) : null}
                </G>
              );
            }}
            theme={{
              background: SURFACE_FILL,
              plotBackground: SURFACE_FILL,
              grid: GRID_COLOR,
              axis: AXIS_COLOR,
              text: TEXT_COLOR,
              mutedText: MUTED_TEXT_COLOR,
              typography: {
                fontFamily: typography.fontFamily.medium,
                axisLabelSize: 12,
              },
            }}
          />
        ) : (
          <View style={[styles.placeholder, { height }]}>
            <Text style={styles.placeholderText}>Loading chart...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: SURFACE_FILL,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingHorizontal: CARD_HORIZONTAL_PADDING,
    paddingVertical: CARD_VERTICAL_PADDING,
    overflow: 'hidden',
  },
  viewport: {
    width: '100%',
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: tokens.colors.textSecondary,
  },
});
