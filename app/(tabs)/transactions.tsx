import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/theme-provider';
import { typography, spacing, borderRadius } from '@/theme';
import { useTransactionStore } from '@/stores/transaction-store';
import { formatCurrency, formatSignedAmount } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { getCategoryById } from '@/features/categorizer/categorizer';
import { Transaction, TransactionType } from '@/types';
import { TransactionSkeleton } from '@/components/ui/Skeleton';

const FILTERS: { label: string; value: TransactionType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Transfer', value: 'transfer' },
];

function getCategoryEmoji(iconName: string): string {
  const emojiMap: Record<string, string> = {
    'utensils': '🍔', 'shopping-cart': '🛒', 'car': '🚗', 'home': '🏠',
    'shopping-bag': '🛍️', 'heart-pulse': '💊', 'film': '🎬', 'receipt': '📱',
    'graduation-cap': '📚', 'wallet': '💰', 'arrow-right-left': '💸', 'circle-help': '❓',
  };
  return emojiMap[iconName] || '💰';
}

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<TransactionType | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { transactions, loadTransactions, deleteTransaction, setFilter, isLoading } = useTransactionStore();

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleFilterChange = (filter: TransactionType | 'all') => {
    setActiveFilter(filter);
    setFilter({
      type: filter === 'all' ? undefined : filter,
      searchQuery: searchQuery || undefined,
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilter({
      type: activeFilter === 'all' ? undefined : activeFilter,
      searchQuery: query || undefined,
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  }, []);

  const renderTransaction = ({ item: tx }: { item: Transaction }) => {
    const category = getCategoryById(tx.categoryId || 'cat_uncategorized');
    return (
      <Pressable
        style={({ pressed }) => [
          styles.txRow,
          { borderBottomColor: theme.border },
          pressed && { opacity: 0.7, backgroundColor: theme.surfaceElevated }
        ]}
        onPress={() => router.push(`/transaction/${tx.id}`)}
      >
        <View style={[styles.txIcon, { backgroundColor: category.color + '20' }]}>
          <Text style={styles.txIconText}>{getCategoryEmoji(category.icon)}</Text>
        </View>
        <View style={styles.txInfo}>
          <Text style={[styles.txMerchant, { color: theme.text }]} numberOfLines={1}>
            {tx.merchant || category.name}
          </Text>
          <Text style={[styles.txMeta, { color: theme.textMuted }]}>
            {formatDate(tx.date, 'short')} · {category.name}
          </Text>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: tx.type === 'income' ? theme.income : theme.expense }]}>
            {formatSignedAmount(tx.amount, tx.type)}
          </Text>
          <Text style={[styles.txSource, { color: theme.textMuted }]}>
            {tx.source}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Transactions</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search transactions..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.value}
            style={({ pressed }) => [
              styles.filterChip,
              {
                backgroundColor: activeFilter === f.value ? theme.primary : theme.surface,
                borderColor: activeFilter === f.value ? theme.primary : theme.border,
              },
              pressed && { opacity: 0.8 }
            ]}
            onPress={() => handleFilterChange(f.value)}
          >
            <Text
              style={[
                styles.filterLabel,
                { color: activeFilter === f.value ? '#FFFFFF' : theme.textSecondary },
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Transaction List */}
      {isLoading && transactions.length === 0 ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
          <TransactionSkeleton />
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No transactions found
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.xl },

  searchWrapper: { paddingHorizontal: 20, marginBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.base,
    padding: 0,
  },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
  },

  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txIconText: { fontSize: 20 },
  txInfo: { flex: 1 },
  txMerchant: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.base,
    marginBottom: 3,
  },
  txMeta: { fontFamily: typography.fontFamily.regular, fontSize: typography.sizes.xs },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontFamily: typography.fontFamily.mono, fontSize: typography.sizes.base, marginBottom: 3 },
  txSource: { fontFamily: typography.fontFamily.regular, fontSize: 10, textTransform: 'uppercase' },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontFamily: typography.fontFamily.regular, fontSize: typography.sizes.base },
});
