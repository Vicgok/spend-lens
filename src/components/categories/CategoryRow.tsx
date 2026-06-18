import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Category } from '@/types';
import { borderRadius, spacing, typography } from '@/theme';
import { CATEGORIES_SCREEN_COLORS, CATEGORIES_SCREEN_COPY } from '@/lib/constants';

const ChevronRightIcon = React.memo(function ChevronRightIcon({
  expanded,
}: {
  expanded: boolean;
}) {
  return (
    <Svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={CATEGORIES_SCREEN_COLORS.primary}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={expanded ? styles.chevronExpanded : undefined}
    >
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  );
});

interface CategoryRowProps {
  category: Category;
  expanded: boolean;
  keywordInput: string;
  onPress: (categoryId: string) => void;
  onKeywordInputChange: (categoryId: string, value: string) => void;
  onAddKeyword: (categoryId: string) => void;
  onDeleteKeyword: (categoryId: string, keyword: string) => void;
  onDeleteCategory: (category: Category) => void;
}

function normalizeIcon(iconName: string): string {
  const emojiMap: Record<string, string> = {
    utensils: '\u{1F354}',
    'shopping-cart': '\u{1F6D2}',
    car: '\u{1F697}',
    home: '\u{1F3E0}',
    'shopping-bag': '\u{1F6CD}',
    'heart-pulse': '\u{1F48A}',
    film: '\u{1F3AC}',
    receipt: '\u{1F4F1}',
    'graduation-cap': '\u{1F4DA}',
    wallet: '\u{1F4B0}',
    'arrow-right-left': '\u{1F4B8}',
    'circle-help': '\u{2753}',
  };

  return emojiMap[iconName] || iconName || '\u{1F4B0}';
}

export const CategoryRow = React.memo(function CategoryRow({
  category,
  expanded,
  keywordInput,
  onPress,
  onKeywordInputChange,
  onAddKeyword,
  onDeleteKeyword,
  onDeleteCategory,
}: CategoryRowProps) {
  const keywordCountLabel = `${category.keywords.length} keyword${category.keywords.length === 1 ? '' : 's'}`;

  return (
    <View style={styles.card}>
      <Pressable onPress={() => onPress(category.id)} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
        <View style={[styles.iconWrap, { backgroundColor: `${category.color}20` }]}>
          <Text style={styles.icon}>{normalizeIcon(category.icon)}</Text>
        </View>

        <View style={styles.textWrap}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{category.name}</Text>
            {category.isCustom ? <Text style={styles.customPill}>{CATEGORIES_SCREEN_COPY.customCategory}</Text> : null}
          </View>
          <Text style={styles.subtitle}>{expanded ? CATEGORIES_SCREEN_COPY.keywordRulesHint : 'Merchant keyword rules'}</Text>
        </View>

        <View style={styles.rightWrap}>
          <View style={styles.keywordBadge}>
            <Text style={styles.keywordBadgeText}>{keywordCountLabel}</Text>
          </View>
          <ChevronRightIcon expanded={expanded} />
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.expanded}>
          <Text style={styles.expandedTitle}>{CATEGORIES_SCREEN_COPY.keywordRules}</Text>

          <View style={styles.chipsWrap}>
            {category.keywords.length === 0 ? (
              <Text style={styles.emptyText}>{CATEGORIES_SCREEN_COPY.noKeywords}</Text>
            ) : (
              category.keywords.map((keyword) => (
                <View key={keyword} style={styles.chip}>
                  <Text style={styles.chipText}>{keyword}</Text>
                  <Pressable onPress={() => onDeleteKeyword(category.id, keyword)} hitSlop={8}>
                    <Text style={styles.chipDelete}>x</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>

          <View style={styles.inputRow}>
            <TextInput
              value={keywordInput}
              onChangeText={(value) => onKeywordInputChange(category.id, value)}
              onSubmitEditing={() => onAddKeyword(category.id)}
              placeholder={CATEGORIES_SCREEN_COPY.addKeywordPlaceholder}
              placeholderTextColor={CATEGORIES_SCREEN_COLORS.secondary}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable onPress={() => onAddKeyword(category.id)} style={styles.addButton}>
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>

          {category.isCustom ? (
            <Pressable onPress={() => onDeleteCategory(category)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>{CATEGORIES_SCREEN_COPY.deleteCategory}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: CATEGORIES_SCREEN_COLORS.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: CATEGORIES_SCREEN_COLORS.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  row: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 2,
  },
  rowPressed: {
    backgroundColor: 'rgba(116, 81, 67, 0.04)',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 20,
  },
  textWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
    color: CATEGORIES_SCREEN_COLORS.primary,
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: CATEGORIES_SCREEN_COLORS.secondary,
  },
  customPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    backgroundColor: CATEGORIES_SCREEN_COLORS.lightGreen,
    color: CATEGORIES_SCREEN_COLORS.green,
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  rightWrap: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  keywordBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: CATEGORIES_SCREEN_COLORS.badgeBg,
    borderWidth: 1,
    borderColor: CATEGORIES_SCREEN_COLORS.badgeBorder,
  },
  keywordBadgeText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    color: CATEGORIES_SCREEN_COLORS.primary,
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  expanded: {
    borderTopWidth: 1,
    borderTopColor: CATEGORIES_SCREEN_COLORS.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  expandedTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
    color: CATEGORIES_SCREEN_COLORS.primary,
    marginBottom: spacing.sm,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: CATEGORIES_SCREEN_COLORS.secondary,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.sm + 2,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: CATEGORIES_SCREEN_COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: CATEGORIES_SCREEN_COLORS.border,
  },
  chipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: CATEGORIES_SCREEN_COLORS.primary,
  },
  chipDelete: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 12,
    color: CATEGORIES_SCREEN_COLORS.destructive,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: CATEGORIES_SCREEN_COLORS.border,
    backgroundColor: CATEGORIES_SCREEN_COLORS.surfaceMuted,
    paddingHorizontal: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: CATEGORIES_SCREEN_COLORS.primary,
  },
  addButton: {
    height: 44,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.lg,
    backgroundColor: CATEGORIES_SCREEN_COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
    color: CATEGORIES_SCREEN_COLORS.surface,
  },
  deleteButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
    color: CATEGORIES_SCREEN_COLORS.destructive,
  },
});

export default CategoryRow;
