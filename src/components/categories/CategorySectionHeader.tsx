import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '@/theme';
import { CATEGORIES_SCREEN_COLORS } from '@/lib/constants';

interface CategorySectionHeaderProps {
  summary: string;
  hint: string;
}

export const CategorySectionHeader = React.memo(function CategorySectionHeader({
  summary,
  hint,
}: CategorySectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.summary}>{summary}</Text>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  summary: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    color: CATEGORIES_SCREEN_COLORS.primary,
    marginBottom: spacing.xs,
  },
  hint: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: CATEGORIES_SCREEN_COLORS.secondary,
  },
});

export default CategorySectionHeader;
