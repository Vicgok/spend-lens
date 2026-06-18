import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { BaseModal, TabHeader } from '@/components/ui';
import CategoryFilterTabs from '@/components/categories/CategoryFilterTabs';
import CategoryRow from '@/components/categories/CategoryRow';
import CategorySectionHeader from '@/components/categories/CategorySectionHeader';
import { DEFAULT_CATEGORIES } from '@/features/categorizer/categories';
import {
  CATEGORIES_SCREEN_COLORS,
  CATEGORIES_SCREEN_COPY,
} from '@/lib/constants';
import { useTransactionStore } from '@/stores/transaction-store';
import { borderRadius, spacing, typography } from '@/theme';
import { Category, CategoryType } from '@/types';

const PRESET_EMOJIS = [
  '\u{1F354}', '\u{1F355}', '\u{1F32E}', '\u{1F369}', '\u{2615}', '\u{1F37A}',
  '\u{1F697}', '\u{2708}', '\u{1F686}', '\u{1F6B2}', '\u{26FD}', '\u{1F6CD}',
  '\u{1F455}', '\u{1F460}', '\u{1F381}', '\u{1F6D2}', '\u{1F48A}', '\u{1F3CB}',
  '\u{1F9F4}', '\u{1F487}', '\u{1F3AC}', '\u{1F3AE}', '\u{1F3A7}', '\u{1F4DA}',
  '\u{26BD}', '\u{1F43E}', '\u{1F4B0}', '\u{1F4B8}', '\u{1F4B3}', '\u{1F4F1}',
  '\u{1F3E0}', '\u{1F50C}', '\u{2753}', '\u{1F4BC}', '\u{2709}', '\u{1F525}',
];

const PRESET_COLORS = [
  '#6C5CE7',
  '#00CEC9',
  '#FD79A8',
  '#FDCB6E',
  '#74B9FF',
  '#E17055',
  '#00B894',
  '#A29BFE',
  '#FF7675',
  '#55EFC4',
  '#E74C3C',
  '#34495E',
];

const SearchIcon = React.memo(function SearchIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CATEGORIES_SCREEN_COLORS.secondary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="11" cy="11" r="8" />
      <Path d="M21 21l-4.3-4.3" />
    </Svg>
  );
});

const PlusIcon = React.memo(function PlusIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={CATEGORIES_SCREEN_COLORS.surface} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 5v14" />
      <Path d="M5 12h14" />
    </Svg>
  );
});

const keyExtractor = (item: Category) => item.id;

function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { categories: storeCategories, loadCategories, createCategory, deleteCategory, updateCategoryKeywords } = useTransactionStore();

  const [activeTab, setActiveTab] = useState<CategoryType>('expense');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newKeywordInputs, setNewKeywordInputs] = useState<Record<string, string>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<CategoryType>('expense');
  const [selectedEmoji, setSelectedEmoji] = useState('\u{1F6CD}');
  const [selectedColor, setSelectedColor] = useState('#6C5CE7');
  const [initialKeywords, setInitialKeywords] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const categoriesList = storeCategories.length > 0 ? storeCategories : DEFAULT_CATEGORIES;

  const filteredCategories = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return categoriesList
      .filter((category) => category.type === activeTab || category.type === 'both')
      .filter((category) => {
        if (!normalizedQuery) return true;

        return (
          category.name.toLowerCase().includes(normalizedQuery) ||
          category.keywords.some((keyword) => keyword.toLowerCase().includes(normalizedQuery))
        );
      })
      .sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
        return left.name.localeCompare(right.name);
      });
  }, [activeTab, categoriesList, searchQuery]);

  const categorySummary = `${filteredCategories.length} ${activeTab === 'expense' ? 'Expense' : 'Income'} Categories`;

  const resetModal = useCallback(() => {
    setCatName('');
    setCatType(activeTab);
    setSelectedEmoji('\u{1F6CD}');
    setSelectedColor('#6C5CE7');
    setInitialKeywords('');
    setIsSubmitting(false);
  }, [activeTab]);

  const handleToggleExpand = useCallback((categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedCategoryId((current) => (current === categoryId ? null : categoryId));
  }, []);

  const handleKeywordInputChange = useCallback((categoryId: string, value: string) => {
    setNewKeywordInputs((current) => ({ ...current, [categoryId]: value }));
  }, []);

  const handleAddKeyword = useCallback(async (categoryId: string) => {
    const text = newKeywordInputs[categoryId]?.trim().toLowerCase();
    if (!text) return;

    const category = categoriesList.find((item) => item.id === categoryId);
    if (!category) return;

    if (category.keywords.includes(text)) {
      Alert.alert('Duplicate Keyword', 'This keyword already exists in this category.');
      return;
    }

    try {
      await updateCategoryKeywords(categoryId, [...category.keywords, text]);
      setNewKeywordInputs((current) => ({ ...current, [categoryId]: '' }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to add keyword:', error);
      Alert.alert('Error', 'Failed to add keyword.');
    }
  }, [categoriesList, newKeywordInputs, updateCategoryKeywords]);

  const handleDeleteKeyword = useCallback(async (categoryId: string, keyword: string) => {
    const category = categoriesList.find((item) => item.id === categoryId);
    if (!category) return;

    try {
      await updateCategoryKeywords(categoryId, category.keywords.filter((item) => item !== keyword));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Failed to delete keyword:', error);
      Alert.alert('Error', 'Failed to delete keyword.');
    }
  }, [categoriesList, updateCategoryKeywords]);

  const handleDeleteCategory = useCallback((category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? Transactions in this category will be moved to "Other".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
              setExpandedCategoryId(null);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch (error) {
              console.error('Failed to delete category:', error);
              Alert.alert('Error', 'Failed to delete category.');
            }
          },
        },
      ]
    );
  }, [deleteCategory]);

  const handleCreateCategory = useCallback(async () => {
    if (!catName.trim()) {
      Alert.alert('Required Fields', 'Please enter a category name.');
      return;
    }

    setIsSubmitting(true);

    try {
      const keywordsArray = initialKeywords
        .split(',')
        .map((keyword) => keyword.trim().toLowerCase())
        .filter(Boolean);

      await createCategory({
        name: catName.trim(),
        type: catType,
        icon: selectedEmoji,
        color: selectedColor,
        keywords: keywordsArray,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddModal(false);
      resetModal();
    } catch (error) {
      console.error('Failed to create category:', error);
      Alert.alert('Error', 'Failed to create category.');
      setIsSubmitting(false);
    }
  }, [catName, catType, createCategory, initialKeywords, resetModal, selectedColor, selectedEmoji]);

  const handleOpenAddModal = useCallback(() => {
    resetModal();
    setShowAddModal(true);
  }, [resetModal]);

  const handleChangeTab = useCallback((nextTab: CategoryType) => {
    setActiveTab(nextTab);
    setExpandedCategoryId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const renderListHeader = useCallback(() => (
    <View>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{CATEGORIES_SCREEN_COPY.back}</Text>
        </Pressable>
        <CategoryFilterTabs activeTab={activeTab} onChange={handleChangeTab} />
      </View>

      <TabHeader
        microHeader={CATEGORIES_SCREEN_COPY.microHeader}
        title={CATEGORIES_SCREEN_COPY.title}
        subtitle={CATEGORIES_SCREEN_COPY.subtitle}
        variant="tactile"
        style={styles.header}
      />

      <View style={styles.searchCard}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <SearchIcon />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={CATEGORIES_SCREEN_COPY.searchPlaceholder}
              placeholderTextColor={CATEGORIES_SCREEN_COLORS.secondary}
              style={styles.searchInput}
            />
          </View>

          <Pressable onPress={handleOpenAddModal} style={styles.headerAddButton}>
            <Text style={styles.headerAddButtonText}>{CATEGORIES_SCREEN_COPY.addCategory}</Text>
          </Pressable>
        </View>

        <CategorySectionHeader
          summary={categorySummary}
          hint={CATEGORIES_SCREEN_COPY.manageHint}
        />
      </View>
    </View>
  ), [activeTab, categorySummary, handleChangeTab, handleOpenAddModal, insets.top, searchQuery]);

  const renderItem = useCallback(({ item }: { item: Category }) => (
    <CategoryRow
      category={item}
      expanded={expandedCategoryId === item.id}
      keywordInput={newKeywordInputs[item.id] || ''}
      onPress={handleToggleExpand}
      onKeywordInputChange={handleKeywordInputChange}
      onAddKeyword={handleAddKeyword}
      onDeleteKeyword={handleDeleteKeyword}
      onDeleteCategory={handleDeleteCategory}
    />
  ), [
    expandedCategoryId,
    handleAddKeyword,
    handleDeleteCategory,
    handleDeleteKeyword,
    handleKeywordInputChange,
    handleToggleExpand,
    newKeywordInputs,
  ]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{CATEGORIES_SCREEN_COPY.noResultsTitle}</Text>
      <Text style={styles.emptyBody}>{CATEGORIES_SCREEN_COPY.noResultsBody}</Text>
    </View>
  ), []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      <FlatList
        data={filteredCategories}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        extraData={{ expandedCategoryId, newKeywordInputs }}
      />

      <Pressable onPress={handleOpenAddModal} style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}>
        <PlusIcon />
      </Pressable>

      <BaseModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetModal();
        }}
        variant="sheet"
        title={CATEGORIES_SCREEN_COPY.newCategory}
        subtitle="Create a new rule set for SpendLens auto-categorization."
        primaryAction={{
          label: isSubmitting ? CATEGORIES_SCREEN_COPY.creatingCategory : CATEGORIES_SCREEN_COPY.createCategory,
          onPress: handleCreateCategory,
          disabled: isSubmitting,
        }}
        secondaryAction={{
          label: 'Cancel',
          onPress: () => {
            setShowAddModal(false);
            resetModal();
          },
        }}
        avoidKeyboard
      >
        <View style={styles.modalContent}>
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>{CATEGORIES_SCREEN_COPY.categoryName}</Text>
            <TextInput
              value={catName}
              onChangeText={setCatName}
              placeholder={CATEGORIES_SCREEN_COPY.categoryNamePlaceholder}
              placeholderTextColor={CATEGORIES_SCREEN_COLORS.secondary}
              style={styles.fieldInput}
              autoFocus
            />
          </View>

          <Text style={styles.modalSectionTitle}>{CATEGORIES_SCREEN_COPY.categoryType}</Text>
          <CategoryFilterTabs activeTab={catType} onChange={setCatType} />

          <Text style={styles.modalSectionTitle}>{CATEGORIES_SCREEN_COPY.iconEmoji}</Text>
          <View style={styles.emojiGrid}>
            {PRESET_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => setSelectedEmoji(emoji)}
                style={[styles.emojiCell, selectedEmoji === emoji && styles.emojiCellSelected]}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.modalSectionTitle}>{CATEGORIES_SCREEN_COPY.themeColor}</Text>
          <View style={styles.colorGrid}>
            {PRESET_COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => setSelectedColor(color)}
                style={[styles.colorCell, { backgroundColor: color }, selectedColor === color && styles.colorCellSelected]}
              />
            ))}
          </View>

          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>{CATEGORIES_SCREEN_COPY.keywordsOptional}</Text>
            <TextInput
              value={initialKeywords}
              onChangeText={setInitialKeywords}
              placeholder={CATEGORIES_SCREEN_COPY.keywordsPlaceholder}
              placeholderTextColor={CATEGORIES_SCREEN_COLORS.secondary}
              style={styles.fieldInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>
      </BaseModal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CATEGORIES_SCREEN_COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['6xl'] + 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  backButton: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  backButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
    color: CATEGORIES_SCREEN_COLORS.primary,
  },
  header: {
    marginBottom: spacing.lg,
  },
  searchCard: {
    backgroundColor: CATEGORIES_SCREEN_COLORS.surface,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: CATEGORIES_SCREEN_COLORS.border,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInputWrap: {
    flex: 1,
    minHeight: 46,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: CATEGORIES_SCREEN_COLORS.border,
    backgroundColor: CATEGORIES_SCREEN_COLORS.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: CATEGORIES_SCREEN_COLORS.primary,
    paddingVertical: 0,
  },
  headerAddButton: {
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: CATEGORIES_SCREEN_COLORS.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 112,
  },
  headerAddButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
    color: CATEGORIES_SCREEN_COLORS.green,
  },
  emptyState: {
    marginTop: spacing.xl,
    backgroundColor: CATEGORIES_SCREEN_COLORS.surface,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: CATEGORIES_SCREEN_COLORS.border,
    padding: spacing.xl,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 17,
    color: CATEGORIES_SCREEN_COLORS.primary,
    marginBottom: spacing.xs,
  },
  emptyBody: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    lineHeight: 19,
    color: CATEGORIES_SCREEN_COLORS.secondary,
  },
  fab: {
    position: 'absolute',
    right: spacing.base,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: CATEGORIES_SCREEN_COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: CATEGORIES_SCREEN_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  modalContent: {
    gap: spacing.base,
    paddingBottom: spacing.sm,
  },
  fieldCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: CATEGORIES_SCREEN_COLORS.border,
    backgroundColor: CATEGORIES_SCREEN_COLORS.surfaceMuted,
    padding: spacing.md,
  },
  fieldLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
    color: CATEGORIES_SCREEN_COLORS.secondary,
    marginBottom: spacing.xs,
  },
  fieldInput: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: CATEGORIES_SCREEN_COLORS.primary,
    paddingVertical: 0,
  },
  modalSectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
    color: CATEGORIES_SCREEN_COLORS.secondary,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emojiCell: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: CATEGORIES_SCREEN_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CATEGORIES_SCREEN_COLORS.surfaceMuted,
  },
  emojiCellSelected: {
    borderColor: CATEGORIES_SCREEN_COLORS.green,
    backgroundColor: CATEGORIES_SCREEN_COLORS.lightGreen,
  },
  emojiText: {
    fontSize: 22,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorCell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCellSelected: {
    borderColor: CATEGORIES_SCREEN_COLORS.surface,
    shadowColor: CATEGORIES_SCREEN_COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
});

export default CategoriesScreen;
