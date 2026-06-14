import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { typography, tokens, spacing } from '@/theme';
import { useTheme } from '@/providers/theme-provider';

interface TabHeaderProps {
  microHeader?: string;
  title: string;
  titleSuffix?: React.ReactNode;
  subtitle?: string | React.ReactNode;
  renderRight?: () => React.ReactNode;
  variant?: 'tactile' | 'dynamic';
  showDivider?: boolean;
  style?: ViewStyle;
}

export default function TabHeader({
  microHeader,
  title,
  titleSuffix,
  subtitle,
  renderRight,
  variant = 'tactile',
  showDivider = false,
  style,
}: TabHeaderProps) {
  const { theme } = useTheme();

  const isTactile = variant === 'tactile';

  const colors = {
    microHeader: isTactile ? tokens.colors.tactileMuted : theme.textSecondary,
    title: isTactile ? tokens.colors.textPrimary : theme.text,
    subtitle: isTactile ? tokens.colors.textPrimary : theme.textSecondary,
    divider: isTactile ? tokens.colors.tactileBorder : theme.border,
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerMain}>
        {/* Left Content */}
        <View style={styles.leftContent}>
          {microHeader && (
            <Text style={[styles.microHeader, { color: colors.microHeader }]}>
              {microHeader}
            </Text>
          )}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.title }]} numberOfLines={1}>
              {title}
            </Text>
            {titleSuffix}
          </View>
          {subtitle && (
            <View style={styles.subtitleContainer}>
              {typeof subtitle === 'string' ? (
                <Text style={[styles.subtitle, { color: colors.subtitle }]}>
                  {subtitle}
                </Text>
              ) : (
                subtitle
              )}
            </View>
          )}
        </View>

        {/* Right Content */}
        {renderRight && (
          <View style={styles.rightContent}>
            {renderRight()}
          </View>
        )}
      </View>

      {showDivider && (
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
    width: '100%',
  },
  headerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftContent: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  rightContent: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  microHeader: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 26,
    lineHeight: 32,
  },
  subtitleContainer: {
    marginTop: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 2,
    width: '100%',
    marginTop: spacing.md,
  },
});
