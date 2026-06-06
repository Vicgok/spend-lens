import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/theme-provider';
import { typography, spacing, borderRadius } from '@/theme';
import { useTransactionStore } from '@/stores/transaction-store';
import { TransactionType } from '@/types';
import { DEFAULT_CATEGORIES } from '@/features/categorizer/categories';
import * as Haptics from 'expo-haptics';

const TYPES: { label: string; value: TransactionType; icon: string }[] = [
  { label: 'Expense', value: 'expense', icon: '↓' },
  { label: 'Income', value: 'income', icon: '↑' },
  { label: 'Transfer', value: 'transfer', icon: '↔' },
];

function getCategoryEmoji(iconName: string): string {
  const emojiMap: Record<string, string> = {
    'utensils': '🍔', 'shopping-cart': '🛒', 'car': '🚗', 'home': '🏠',
    'shopping-bag': '🛍️', 'heart-pulse': '💊', 'film': '🎬', 'receipt': '📱',
    'graduation-cap': '📚', 'wallet': '💰', 'arrow-right-left': '💸', 'circle-help': '❓',
  };
  return emojiMap[iconName] || '💰';
}

function formatIndianNumber(valStr: string): string {
  if (!valStr) return '';
  const parts = valStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

  let cleanedInteger = integerPart.replace(/,/g, '');
  // Strip leading zeros unless it's just '0'
  cleanedInteger = cleanedInteger.replace(/^0+(?=\d)/, '');
  if (!cleanedInteger) return decimalPart;

  let lastThree = cleanedInteger.substring(cleanedInteger.length - 3);
  const otherNumbers = cleanedInteger.substring(0, cleanedInteger.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  
  return formattedOthers + lastThree + decimalPart;
}

export default function AddTransactionScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { addTransaction, accounts, categories: storeCategories, loadCategories } = useTransactionStore();

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = (storeCategories.length > 0 ? storeCategories : DEFAULT_CATEGORIES).filter(
    (cat) => cat.type === type || cat.type === 'both'
  );

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setSelectedCategory(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAmountInput = (text: string) => {
    // Allow only numbers and one decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    
    // Format dynamically with Indian numbering delimiters
    const formatted = formatIndianNumber(cleaned);
    setAmount(formatted);
  };

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount.replace(/,/g, ''));
    if (!parsedAmount || parsedAmount <= 0) return;
    if (accounts.length === 0) return;

    setIsSubmitting(true);
    try {
      await addTransaction({
        accountId: accounts[0].id,
        type,
        amount: parsedAmount,
        categoryId: selectedCategory || undefined,
        merchant: merchant.trim() || undefined,
        description: description.trim() || undefined,
        source: 'manual',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Failed to add transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = parseFloat(amount.replace(/,/g, '')) > 0 && accounts.length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.cancelBtn, { color: theme.textSecondary }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Add Transaction</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Type Selector */}
        <View style={[styles.typeRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {TYPES.map((t) => (
            <Pressable
              key={t.value}
              style={[
                styles.typeBtn,
                type === t.value && { backgroundColor: theme.primary },
              ]}
              onPress={() => handleTypeChange(t.value)}
            >
              <Text style={[styles.typeIcon, { color: type === t.value ? '#FFF' : theme.textMuted }]}>
                {t.icon}
              </Text>
              <Text style={[styles.typeLabel, { color: type === t.value ? '#FFF' : theme.textSecondary }]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Amount Input */}
        <View style={styles.amountSection}>
          <Text style={[styles.currencyBig, { color: type === 'income' ? theme.income : type === 'expense' ? theme.expense : theme.primary }]}>
            ₹
          </Text>
          <TextInput
            style={[styles.amountInput, { color: theme.text }]}
            placeholder="0"
            placeholderTextColor={theme.textMuted}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={handleAmountInput}
            autoFocus
          />
        </View>

        {/* Merchant */}
        <View style={[styles.inputGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Merchant / Payee</Text>
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="e.g. Swiggy, Amazon, Rent"
            placeholderTextColor={theme.textMuted}
            value={merchant}
            onChangeText={setMerchant}
          />
        </View>

        {/* Description */}
        <View style={[styles.inputGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Note (optional)</Text>
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="Add a note..."
            placeholderTextColor={theme.textMuted}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Category Picker */}
        <Text style={[styles.catSectionTitle, { color: theme.textSecondary }]}>Category</Text>
        <View style={styles.catGrid}>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.catChip,
                {
                  backgroundColor: selectedCategory === cat.id ? cat.color + '30' : theme.card,
                  borderColor: selectedCategory === cat.id ? cat.color : theme.border,
                },
              ]}
              onPress={() => {
                setSelectedCategory(cat.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={styles.catEmoji}>{getCategoryEmoji(cat.icon)}</Text>
              <Text
                style={[
                  styles.catLabel,
                  { color: selectedCategory === cat.id ? theme.text : theme.textSecondary },
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Push button to bottom if content is short */}
        <View style={{ flex: 1, minHeight: 24 }} />

        {/* Submit Button */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable onPress={handleSubmit} disabled={!isValid || isSubmitting} style={styles.submitWrapper}>
            <LinearGradient
              colors={isValid ? theme.gradientPrimary : [theme.border, theme.border]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submitBtn, (!isValid || isSubmitting) && styles.submitDisabled]}
            >
              <Text style={styles.submitText}>
                {isSubmitting ? 'Adding...' : 'Add Transaction'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  cancelBtn: { fontFamily: typography.fontFamily.medium, fontSize: typography.sizes.base },
  headerTitle: { fontFamily: typography.fontFamily.semibold, fontSize: typography.sizes.md },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, flexGrow: 1 },

  // Type
  typeRow: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: 4,
    marginBottom: 32,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  typeIcon: { fontSize: 16, fontWeight: '700' },
  typeLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.sizes.sm },

  // Amount
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 4,
  },
  currencyBig: {
    fontFamily: typography.fontFamily.monoBold,
    fontSize: 44,
  },
  amountInput: {
    fontFamily: typography.fontFamily.monoBold,
    fontSize: 44,
    minWidth: 60,
    padding: 0,
    textAlign: 'center',
  },

  // Inputs
  inputGroup: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  inputLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.xs,
    marginBottom: 6,
  },
  textInput: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.base,
    padding: 0,
  },

  // Categories
  catSectionTitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
    marginBottom: 12,
    marginTop: 8,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  catEmoji: { fontSize: 16 },
  catLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
    maxWidth: 100,
  },

  // Submit
  bottomBar: {
    width: '100%',
    paddingTop: 12,
  },
  submitWrapper: { width: '100%' },
  submitBtn: {
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontFamily: typography.fontFamily.semibold, fontSize: typography.sizes.md, color: '#FFFFFF' },
});
