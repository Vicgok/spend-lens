import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeOut, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/theme-provider';
import { typography, spacing, borderRadius } from '@/theme';
import { useTransactionStore } from '@/stores/transaction-store';
import { DEFAULT_CATEGORIES } from '@/features/categorizer/categories';
import { Category, CategoryType } from '@/types';

const { width, height } = Dimensions.get('window');

const PRESET_EMOJIS = [
  '🍔', '🍕', '🌮', '🍩', '☕', '🍺',
  '🚗', '✈️', '🚆', '🚲', '⛽', '🛍️',
  '👕', '👠', '🎁', '🛒', '💊', '🏋️',
  '🧴', '💇', '🎬', '🎮', '🎧', '📚',
  '⚽', '🐾', '💰', '💸', '💳', '📱',
  '🏠', '🔌', '❓', '💼', '✉️', '🔥'
];

const PRESET_COLORS = [
  '#6C5CE7', // Electric Purple
  '#00CEC9', // Teal Mint
  '#FD79A8', // Coral Pink
  '#FDCB6E', // Yellow Gold
  '#74B9FF', // Sky Blue
  '#E17055', // Clay Orange
  '#00B894', // Mint Green
  '#A29BFE', // Lavender
  '#FF7675', // Soft Red
  '#55EFC4', // Light Green
  '#E74C3C', // Accent Red
  '#34495E'  // Slate Gray
];

function getCategoryEmoji(iconName: string): string {
  const emojiMap: Record<string, string> = {
    'utensils': '🍔', 'shopping-cart': '🛒', 'car': '🚗', 'home': '🏠',
    'shopping-bag': '🛍️', 'heart-pulse': '💊', 'film': '🎬', 'receipt': '📱',
    'graduation-cap': '📚', 'wallet': '💰', 'arrow-right-left': '💸', 'circle-help': '❓',
  };
  return emojiMap[iconName] || iconName || '💰';
}

function CategoriesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const { categories: storeCategories, loadCategories, createCategory, deleteCategory, updateCategoryKeywords } = useTransactionStore();
  
  const [activeTab, setActiveTab] = useState<CategoryType>('expense');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [newKeywordInputs, setNewKeywordInputs] = useState<Record<string, string>>({});
  
  // Custom Category Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<CategoryType>('expense');
  const [selectedEmoji, setSelectedEmoji] = useState('🛍️');
  const [selectedColor, setSelectedColor] = useState('#6C5CE7');
  const [initialKeywords, setInitialKeywords] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const categoriesList = storeCategories.length > 0 ? storeCategories : DEFAULT_CATEGORIES;
  const filteredCategories = categoriesList.filter(
    (cat) => cat.type === activeTab || cat.type === 'both'
  );

  const toggleExpand = (catId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedCategoryId(expandedCategoryId === catId ? null : catId);
  };

  const handleAddKeyword = async (catId: string) => {
    const text = newKeywordInputs[catId]?.trim().toLowerCase();
    if (!text) return;

    const category = categoriesList.find((c) => c.id === catId);
    if (!category) return;

    if (category.keywords.includes(text)) {
      Alert.alert('Duplicate Keyword', 'This keyword already exists in this category.');
      return;
    }

    const updatedKeywords = [...category.keywords, text];
    
    try {
      await updateCategoryKeywords(catId, updatedKeywords);
      setNewKeywordInputs((prev) => ({ ...prev, [catId]: '' }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to add keyword:', error);
      Alert.alert('Error', 'Failed to add keyword.');
    }
  };

  const handleDeleteKeyword = async (catId: string, keyword: string) => {
    const category = categoriesList.find((c) => c.id === catId);
    if (!category) return;

    const updatedKeywords = category.keywords.filter((kw) => kw !== keyword);

    try {
      await updateCategoryKeywords(catId, updatedKeywords);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Failed to delete keyword:', error);
      Alert.alert('Error', 'Failed to delete keyword.');
    }
  };

  const handleDeleteCategory = (cat: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${cat.name}"? Transactions in this category will be moved to "Other".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(cat.id);
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
  };

  const handleCreateCategory = async () => {
    if (!catName.trim()) {
      Alert.alert('Required Fields', 'Please enter a category name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const keywordsArray = initialKeywords
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k.length > 0);

      await createCategory({
        name: catName.trim(),
        type: catType,
        icon: selectedEmoji,
        color: selectedColor,
        keywords: keywordsArray,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Reset form
      setCatName('');
      setInitialKeywords('');
      setSelectedEmoji('🛍️');
      setSelectedColor('#6C5CE7');
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to create category:', error);
      Alert.alert('Error', 'Failed to create category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, { color: theme.primary }]}>Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Categories</Text>
        <Pressable onPress={() => setShowAddModal(true)} style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, { color: theme.primary, fontWeight: '600' }]}>+ Add</Text>
        </Pressable>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <View style={[styles.tabs, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable
            style={[styles.tab, activeTab === 'expense' && { backgroundColor: theme.primary }]}
            onPress={() => {
              setActiveTab('expense');
              setExpandedCategoryId(null);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[styles.tabText, { color: activeTab === 'expense' ? '#FFF' : theme.textSecondary }]}>
              Expenses
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'income' && { backgroundColor: theme.primary }]}
            onPress={() => {
              setActiveTab('income');
              setExpandedCategoryId(null);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[styles.tabText, { color: activeTab === 'income' ? '#FFF' : theme.textSecondary }]}>
              Income
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Categories list */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredCategories.map((cat, index) => {
          const isExpanded = expandedCategoryId === cat.id;
          return (
            <Animated.View
              key={cat.id}
              layout={Layout.springify()}
              entering={FadeInDown.delay(index * 40)}
              style={[
                styles.categoryCard,
                {
                  backgroundColor: theme.card,
                  borderColor: isExpanded ? cat.color : theme.border,
                },
              ]}
            >
              <Pressable onPress={() => toggleExpand(cat.id)} style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: cat.color + '20' }]}>
                  <Text style={styles.emojiText}>{getCategoryEmoji(cat.icon)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.catName, { color: theme.text }]}>{cat.name}</Text>
                  <Text style={[styles.catSub, { color: theme.textSecondary }]}>
                    {cat.keywords.length} keyword{cat.keywords.length !== 1 && 's'}
                  </Text>
                </View>
                {cat.isCustom && (
                  <View style={[styles.customBadge, { backgroundColor: theme.primary + '15', borderColor: theme.primary }]}>
                    <Text style={[styles.customBadgeText, { color: theme.primary }]}>CUSTOM</Text>
                  </View>
                )}
                <Text style={[styles.expandArrow, { color: theme.textMuted }]}>
                  {isExpanded ? '▼' : '▶'}
                </Text>
              </Pressable>

              {isExpanded && (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.expandedContent}>
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                  
                  {/* Keywords Header */}
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                    AUTO-CATEGORIZATION KEYWORDS
                  </Text>

                  {/* Keywords Chips */}
                  <View style={styles.keywordsGrid}>
                    {cat.keywords.length === 0 ? (
                      <Text style={[styles.noKeywords, { color: theme.textMuted }]}>
                        No keywords yet. Add some below to auto-categorize incoming transactions.
                      </Text>
                    ) : (
                      cat.keywords.map((kw) => (
                        <View
                          key={kw}
                          style={[styles.keywordChip, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                        >
                          <Text style={[styles.keywordText, { color: theme.text }]}>{kw}</Text>
                          <Pressable onPress={() => handleDeleteKeyword(cat.id, kw)} style={styles.deleteKwBtn}>
                            <Text style={[styles.deleteKwText, { color: theme.expense }]}>×</Text>
                          </Pressable>
                        </View>
                      ))
                    )}
                  </View>

                  {/* Add Keyword Input */}
                  <View style={[styles.addKwContainer, { borderColor: theme.border }]}>
                    <TextInput
                      style={[styles.addKwInput, { color: theme.text }]}
                      placeholder="Add matching keyword (e.g. netflix)"
                      placeholderTextColor={theme.textMuted}
                      value={newKeywordInputs[cat.id] || ''}
                      onChangeText={(txt) => setNewKeywordInputs((prev) => ({ ...prev, [cat.id]: txt }))}
                      onSubmitEditing={() => handleAddKeyword(cat.id)}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Pressable
                      onPress={() => handleAddKeyword(cat.id)}
                      style={[styles.addKwBtn, { backgroundColor: theme.primary }]}
                    >
                      <Text style={styles.addKwBtnText}>+</Text>
                    </Pressable>
                  </View>

                  {/* Delete category option */}
                  {cat.isCustom && (
                    <Pressable
                      onPress={() => handleDeleteCategory(cat)}
                      style={[styles.deleteCatBtn, { borderColor: theme.expense + '40' }]}
                    >
                      <Text style={[styles.deleteCatText, { color: theme.expense }]}>Delete Category</Text>
                    </Pressable>
                  )}
                </Animated.View>
              )}
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Add Custom Category Overlay (Modal) */}
      {showAddModal && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.modalOverlay}>
          <Pressable style={styles.overlayPressable} onPress={() => setShowAddModal(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>New Category</Text>
                <Pressable onPress={() => setShowAddModal(false)}>
                  <Text style={[styles.closeText, { color: theme.textSecondary }]}>Cancel</Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                {/* Category Name */}
                <View style={[styles.modalInputGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.modalInputLabel, { color: theme.textSecondary }]}>Name</Text>
                  <TextInput
                    style={[styles.modalTextInput, { color: theme.text }]}
                    placeholder="e.g. Subscriptions, Gifts"
                    placeholderTextColor={theme.textMuted}
                    value={catName}
                    onChangeText={setCatName}
                    autoFocus
                  />
                </View>

                {/* Category Type Switcher */}
                <Text style={[styles.modalSectionTitle, { color: theme.textSecondary }]}>Type</Text>
                <View style={[styles.modalTabs, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Pressable
                    style={[styles.modalTab, catType === 'expense' && { backgroundColor: theme.primary }]}
                    onPress={() => setCatType('expense')}
                  >
                    <Text style={[styles.modalTabText, { color: catType === 'expense' ? '#FFF' : theme.textSecondary }]}>
                      Expense
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalTab, catType === 'income' && { backgroundColor: theme.primary }]}
                    onPress={() => setCatType('income')}
                  >
                    <Text style={[styles.modalTabText, { color: catType === 'income' ? '#FFF' : theme.textSecondary }]}>
                      Income
                    </Text>
                  </Pressable>
                </View>

                {/* Select Emoji */}
                <Text style={[styles.modalSectionTitle, { color: theme.textSecondary }]}>Icon Emoji</Text>
                <View style={styles.emojiGrid}>
                  {PRESET_EMOJIS.map((emoji) => (
                    <Pressable
                      key={emoji}
                      style={[
                        styles.emojiCell,
                        selectedEmoji === emoji && { backgroundColor: theme.primary + '25', borderColor: theme.primary },
                      ]}
                      onPress={() => {
                        setSelectedEmoji(emoji);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={styles.gridEmojiText}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Select Color */}
                <Text style={[styles.modalSectionTitle, { color: theme.textSecondary }]}>Theme Color</Text>
                <View style={styles.colorGrid}>
                  {PRESET_COLORS.map((color) => (
                    <Pressable
                      key={color}
                      style={[
                        styles.colorCell,
                        { backgroundColor: color },
                        selectedColor === color && { borderColor: '#FFFFFF', borderWidth: 2, transform: [{ scale: 1.1 }] },
                      ]}
                      onPress={() => {
                        setSelectedColor(color);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    />
                  ))}
                </View>

                {/* Initial Keywords */}
                <View style={[styles.modalInputGroup, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 12 }]}>
                  <Text style={[styles.modalInputLabel, { color: theme.textSecondary }]}>
                    Keywords (optional, comma separated)
                  </Text>
                  <TextInput
                    style={[styles.modalTextInput, { color: theme.text }]}
                    placeholder="e.g. netflix, spotify, youtube"
                    placeholderTextColor={theme.textMuted}
                    value={initialKeywords}
                    onChangeText={setInitialKeywords}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Submit button */}
                <Pressable
                  onPress={handleCreateCategory}
                  disabled={isSubmitting}
                  style={styles.submitBtnWrapper}
                >
                  <LinearGradient
                    colors={theme.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitBtn}
                  >
                    <Text style={styles.submitBtnText}>
                      {isSubmitting ? 'Creating...' : 'Create Category'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  headerBtnText: { fontFamily: typography.fontFamily.medium, fontSize: typography.sizes.sm },
  headerTitle: { fontFamily: typography.fontFamily.semibold, fontSize: typography.sizes.md },
  
  tabContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  tabs: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: { fontFamily: typography.fontFamily.semibold, fontSize: typography.sizes.sm },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 60, gap: 12 },
  
  categoryCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: { fontSize: 22 },
  cardInfo: { flex: 1 },
  catName: { fontFamily: typography.fontFamily.semibold, fontSize: typography.sizes.base, marginBottom: 2 },
  catSub: { fontFamily: typography.fontFamily.regular, fontSize: typography.sizes.xs },
  
  customBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 6,
  },
  customBadgeText: {
    fontSize: 9,
    fontFamily: typography.fontFamily.bold,
  },
  expandArrow: { fontSize: 12 },
  
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  sectionLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  keywordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  noKeywords: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
    paddingVertical: 4,
  },
  keywordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  keywordText: { fontFamily: typography.fontFamily.medium, fontSize: typography.sizes.xs },
  deleteKwBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteKwText: { fontSize: 14, fontWeight: '700', marginTop: -1 },
  
  addKwContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    height: 44,
    alignItems: 'center',
    overflow: 'hidden',
  },
  addKwInput: {
    flex: 1,
    paddingLeft: 12,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.regular,
  },
  addKwBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addKwBtnText: { color: '#FFF', fontSize: 20, fontWeight: '300' },
  
  deleteCatBtn: {
    marginTop: 18,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  deleteCatText: { fontFamily: typography.fontFamily.semibold, fontSize: typography.sizes.sm },
  
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  overlayPressable: { flex: 1 },
  keyboardView: { width: '100%' },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: height * 0.85,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: { fontFamily: typography.fontFamily.semibold, fontSize: typography.sizes.md },
  closeText: { fontFamily: typography.fontFamily.medium, fontSize: typography.sizes.sm },
  
  modalScroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
  modalInputGroup: { borderRadius: borderRadius.lg, borderWidth: 1, padding: 12, marginBottom: 16 },
  modalInputLabel: { fontFamily: typography.fontFamily.semibold, fontSize: 10, letterSpacing: 0.5, marginBottom: 6 },
  modalTextInput: { fontFamily: typography.fontFamily.regular, fontSize: typography.sizes.base, padding: 0 },
  
  modalSectionTitle: { fontFamily: typography.fontFamily.semibold, fontSize: 10, letterSpacing: 0.5, marginBottom: 8 },
  modalTabs: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: 3,
    marginBottom: 16,
  },
  modalTab: { flex: 1, paddingVertical: 8, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
  modalTabText: { fontFamily: typography.fontFamily.semibold, fontSize: typography.sizes.xs },
  
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  emojiCell: {
    width: (width - 80) / 6,
    height: (width - 80) / 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridEmojiText: { fontSize: 24 },
  
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  colorCell: {
    width: (width - 94) / 6,
    height: (width - 94) / 6,
    borderRadius: (width - 94) / 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  
  submitBtnWrapper: { width: '100%', marginTop: 12 },
  submitBtn: { height: 52, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontFamily: typography.fontFamily.semibold, fontSize: typography.sizes.sm },
});

export default CategoriesScreen;
