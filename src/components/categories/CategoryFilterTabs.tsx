import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CategoryType } from '@/types';
import { borderRadius, spacing, typography } from '@/theme';
import { CATEGORIES_SCREEN_COLORS } from '@/lib/constants';

interface CategoryFilterTabsProps {
  activeTab: CategoryType;
  onChange: (next: CategoryType) => void;
}

export const CategoryFilterTabs = React.memo(function CategoryFilterTabs({
  activeTab,
  onChange,
}: CategoryFilterTabsProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onChange('expense')}
        style={[styles.tab, activeTab === 'expense' && styles.activeTab]}
      >
        <Text style={[styles.tabText, activeTab === 'expense' && styles.activeTabText]}>Expenses</Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('income')}
        style={[styles.tab, activeTab === 'income' && styles.activeTab]}
      >
        <Text style={[styles.tabText, activeTab === 'income' && styles.activeTabText]}>Income</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: CATEGORIES_SCREEN_COLORS.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: CATEGORIES_SCREEN_COLORS.border,
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  tab: {
    minWidth: 96,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: CATEGORIES_SCREEN_COLORS.green,
  },
  tabText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
    color: CATEGORIES_SCREEN_COLORS.secondary,
  },
  activeTabText: {
    color: CATEGORIES_SCREEN_COLORS.surface,
  },
});

export default CategoryFilterTabs;
