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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/theme-provider';
import { typography, spacing, borderRadius } from '@/theme';
import { useTransactionStore } from '@/stores/transaction-store';
import { DEFAULT_CATEGORIES } from '@/features/categorizer/categories';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import * as Haptics from 'expo-haptics';

function getCategoryEmoji(iconName: string): string {
  const emojiMap: Record<string, string> = {
    'utensils': '🍔', 'shopping-cart': '🛒', 'car': '🚗', 'home': '🏠',
    'shopping-bag': '🛍️', 'heart-pulse': '💊', 'film': '🎬', 'receipt': '📱',
    'graduation-cap': '📚', 'wallet': '💰', 'arrow-right-left': '💸', 'circle-help': '❓',
  };
  return emojiMap[iconName] || '💰';
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const { transactions, editTransaction, deleteTransaction, categories: storeCategories, loadCategories } = useTransactionStore();
  const tx = transactions.find((t) => t.id === id);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const [merchant, setMerchant] = useState(tx ? tx.merchant || '' : '');
  const [description, setDescription] = useState(tx ? tx.description || '' : '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(tx ? tx.categoryId : null);
  const [amount, setAmount] = useState(tx ? tx.amount.toString() : '0');
  const [isSaving, setIsSaving] = useState(false);

  if (!tx) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>Transaction not found</Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.primary }]}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const categories = (storeCategories.length > 0 ? storeCategories : DEFAULT_CATEGORIES).filter(
    (cat) => cat.type === tx.type || cat.type === 'both'
  );

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid number greater than 0.');
      return;
    }

    setIsSaving(true);
    try {
      await editTransaction(tx.id, {
        merchant: merchant.trim() || null,
        description: description.trim() || null,
        categoryId: selectedCategory,
        amount: parsedAmount,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Failed to save transaction:', error);
      Alert.alert('Error', 'Failed to save transaction changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This will restore the money to your account balance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(tx.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              router.back();
            } catch (error) {
              console.error('Failed to delete transaction:', error);
              Alert.alert('Error', 'Failed to delete transaction.');
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, { color: theme.primary }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Details</Text>
        <Pressable onPress={handleDelete} style={styles.headerBtn}>
          <Text style={[styles.deleteBtnText, { color: theme.expense }]}>Delete</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Large Amount & Metadata */}
        <View style={styles.amountContainer}>
          <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>
            {tx.type.toUpperCase()} via {tx.source.toUpperCase()}
          </Text>
          <View style={styles.amountInputRow}>
            <Text style={[styles.currencySymbol, { color: tx.type === 'income' ? theme.income : theme.expense }]}>₹</Text>
            <TextInput
              style={[styles.amountInput, { color: theme.text }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={theme.textMuted}
            />
          </View>
          <Text style={[styles.dateText, { color: theme.textMuted }]}>
            Recorded on {formatDate(tx.date, 'long')}
          </Text>
        </View>

        {/* Edit Fields */}
        <View style={styles.fields}>
          {/* Merchant */}
          <View style={[styles.inputGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Merchant / Payee</Text>
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              placeholder="e.g. Swiggy, Amazon"
              placeholderTextColor={theme.textMuted}
              value={merchant}
              onChangeText={setMerchant}
            />
          </View>

          {/* Description */}
          <View style={[styles.inputGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              {tx.source === 'sms' ? 'Raw Message / Note' : 'Note'}
            </Text>
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              placeholder="Add a note..."
              placeholderTextColor={theme.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Category Picker */}
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Category</Text>
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
        </View>

        {/* Flexible spacer */}
        <View style={{ flex: 1, minHeight: 24 }} />

        {/* Save Button */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable onPress={handleSave} disabled={isSaving} style={styles.saveWrapper}>
            <LinearGradient
              colors={theme.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Saving...' : 'Save Changes'}
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
  errorText: { fontFamily: typography.fontFamily.medium, fontSize: typography.sizes.md, marginBottom: 16 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: borderRadius.md },
  backBtnText: { fontFamily: typography.fontFamily.semibold, color: '#FFFFFF', fontSize: typography.sizes.sm },

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
  deleteBtnText: { fontFamily: typography.fontFamily.semibold, fontSize: typography.sizes.sm },
  headerTitle: { fontFamily: typography.fontFamily.semibold, fontSize: typography.sizes.md },

  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, flexGrow: 1 },

  amountContainer: { alignItems: 'center', marginBottom: 32 },
  amountLabel: { fontFamily: typography.fontFamily.semibold, fontSize: 10, letterSpacing: 1, marginBottom: 6 },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  currencySymbol: { fontFamily: typography.fontFamily.monoBold, fontSize: 40, marginRight: 4 },
  amountInput: { fontFamily: typography.fontFamily.monoBold, fontSize: 48, padding: 0, minWidth: 150, textAlign: 'center' },
  dateText: { fontFamily: typography.fontFamily.regular, fontSize: typography.sizes.xs, marginTop: 8 },

  fields: { gap: 20 },
  inputGroup: { borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1 },
  inputLabel: { fontFamily: typography.fontFamily.semibold, fontSize: 10, letterSpacing: 0.5, marginBottom: spacing.xs },
  textInput: { fontFamily: typography.fontFamily.regular, fontSize: typography.sizes.base, padding: 0, minHeight: 24, textAlignVertical: 'top' },

  sectionTitle: { fontFamily: typography.fontFamily.semibold, fontSize: 10, letterSpacing: 0.5, marginTop: 12, marginBottom: 6 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catChip: { flexDirection: 'row', alignItems: 'center', width: '48%', gap: 8, paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderRadius: borderRadius.md, borderWidth: 1 },
  catEmoji: { fontSize: 20 },
  catLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.sizes.sm, flex: 1 },

  bottomBar: { width: '100%', paddingTop: 16 },
  saveWrapper: { width: '100%' },
  saveBtn: { height: 56, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { fontFamily: typography.fontFamily.semibold, fontSize: typography.sizes.md, color: '#FFFFFF' },
});
