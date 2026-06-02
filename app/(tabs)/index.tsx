import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/theme-provider';
import { typography, spacing, borderRadius } from '@/theme';
import { useTransactionStore } from '@/stores/transaction-store';
import { formatCurrency, formatSignedAmount } from '@/utils/currency';
import { formatDate, getMonthLabel } from '@/utils/date';
import { getCategoryById } from '@/features/categorizer/categorizer';
import { syncSMSFromDevice, startSMSListener } from '@/features/sms-parser/sms-reader';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);

  const {
    transactions,
    accounts,
    monthlyTotals,
    categoryTotals,
    loadAccounts,
    loadTransactions,
    loadMonthlyStats,
    getTotalBalance,
    loadCategories,
  } = useTransactionStore();

  const loadData = useCallback(async () => {
    try {
      await syncSMSFromDevice();
    } catch (e) {
      console.warn('SMS sync error:', e);
    }
    await Promise.all([
      loadAccounts(),
      loadTransactions(),
      loadMonthlyStats(),
      loadCategories(),
    ]);
  }, [loadAccounts, loadTransactions, loadMonthlyStats, loadCategories]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = startSMSListener((count) => {
      if (count > 0) {
        loadData();
      }
    });
    return unsubscribe;
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const totalBalance = getTotalBalance();
  const recentTransactions = transactions.slice(0, 5);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              {getGreeting()} 👋
            </Text>
            <Text style={[styles.appName, { color: theme.text }]}>SpendLens</Text>
          </View>
          <Text style={[styles.monthLabel, { color: theme.textSecondary }]}>
            {getMonthLabel()}
          </Text>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={theme.gradientCross}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(totalBalance)}
          </Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatLabel}>↑ Income</Text>
              <Text style={styles.balanceStatAmount}>
                {formatCurrency(monthlyTotals.totalIncome)}
              </Text>
            </View>
            <View style={[styles.balanceDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatLabel}>↓ Expense</Text>
              <Text style={styles.balanceStatAmount}>
                {formatCurrency(monthlyTotals.totalExpense)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable
            style={[styles.quickAction, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/add-transaction')}
          >
            <Text style={styles.quickActionEmoji}>➕</Text>
            <Text style={[styles.quickActionLabel, { color: theme.text }]}>Add</Text>
          </Pressable>
          <Pressable
            style={[styles.quickAction, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/(tabs)/transactions')}
          >
            <Text style={styles.quickActionEmoji}>📋</Text>
            <Text style={[styles.quickActionLabel, { color: theme.text }]}>History</Text>
          </Pressable>
          <Pressable
            style={[styles.quickAction, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/(tabs)/analytics')}
          >
            <Text style={styles.quickActionEmoji}>📊</Text>
            <Text style={[styles.quickActionLabel, { color: theme.text }]}>Insights</Text>
          </Pressable>
          <Pressable
            style={[styles.quickAction, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Text style={styles.quickActionEmoji}>🎯</Text>
            <Text style={[styles.quickActionLabel, { color: theme.text }]}>Goals</Text>
          </Pressable>
        </View>

        {/* Spending by Category */}
        {categoryTotals.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Spending by Category
            </Text>
            {categoryTotals.slice(0, 5).map((cat) => (
              <View key={cat.categoryId} style={[styles.categoryRow, { borderBottomColor: theme.border }]}>
                <View style={styles.categoryLeft}>
                  <View style={[styles.categoryDot, { backgroundColor: cat.categoryColor }]} />
                  <Text style={[styles.categoryName, { color: theme.text }]}>
                    {cat.categoryName}
                  </Text>
                </View>
                <View style={styles.categoryRight}>
                  <Text style={[styles.categoryAmount, { color: theme.text }]}>
                    {formatCurrency(cat.total)}
                  </Text>
                  <Text style={[styles.categoryPercent, { color: theme.textSecondary }]}>
                    {cat.percentage.toFixed(0)}%
                  </Text>
                </View>
              </View>
            ))}
            {/* Category bar */}
            <View style={[styles.categoryBar, { backgroundColor: theme.surfaceElevated }]}>
              {categoryTotals.slice(0, 5).map((cat) => (
                <View
                  key={cat.categoryId}
                  style={[styles.categoryBarSegment, {
                    backgroundColor: cat.categoryColor,
                    flex: cat.percentage,
                  }]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Recent Transactions
            </Text>
            {transactions.length > 5 && (
              <Pressable onPress={() => router.push('/(tabs)/transactions')}>
                <Text style={[styles.seeAll, { color: theme.primary }]}>See All</Text>
              </Pressable>
            )}
          </View>

          {recentTransactions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No transactions yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Add your first transaction or enable SMS parsing to get started.
              </Text>
              <Pressable
                style={[styles.emptyButton, { borderColor: theme.primary }]}
                onPress={() => router.push('/add-transaction')}
              >
                <Text style={[styles.emptyButtonText, { color: theme.primary }]}>
                  + Add Transaction
                </Text>
              </Pressable>
            </View>
          ) : (
            recentTransactions.map((tx) => {
              const category = getCategoryById(tx.categoryId || 'cat_uncategorized');
              return (
                <Pressable
                  key={tx.id}
                  style={[styles.transactionRow, { borderBottomColor: theme.border }]}
                  onPress={() => router.push(`/transaction/${tx.id}`)}
                >
                  <View style={[styles.txIcon, { backgroundColor: category.color + '20' }]}>
                    <Text style={styles.txIconText}>
                      {getCategoryEmoji(category.icon)}
                    </Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={[styles.txMerchant, { color: theme.text }]} numberOfLines={1}>
                      {tx.merchant || category.name}
                    </Text>
                    <Text style={[styles.txDate, { color: theme.textMuted }]}>
                      {formatDate(tx.date, 'short')} · {tx.source.toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: tx.type === 'income' ? theme.income : theme.expense },
                    ]}
                  >
                    {formatSignedAmount(tx.amount, tx.type)}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>

        {/* Accounts */}
        {accounts.length > 0 && (
          <View style={[styles.section, { marginBottom: 100 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Accounts</Text>
            <View style={styles.accountsGrid}>
              {accounts.map((acc) => (
                <View
                  key={acc.id}
                  style={[styles.accountCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <Text style={styles.accountEmoji}>{acc.icon || '🏦'}</Text>
                  <Text style={[styles.accountName, { color: theme.textSecondary }]}>
                    {acc.name}
                  </Text>
                  <Text style={[styles.accountBalance, { color: theme.text }]}>
                    {formatCurrency(acc.balance)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={styles.fabWrapper}
        onPress={() => router.push('/add-transaction')}
      >
        <LinearGradient
          colors={theme.gradientPrimary}
          style={styles.fab}
        >
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getCategoryEmoji(iconName: string): string {
  const emojiMap: Record<string, string> = {
    'utensils': '🍔',
    'shopping-cart': '🛒',
    'car': '🚗',
    'home': '🏠',
    'shopping-bag': '🛍️',
    'heart-pulse': '💊',
    'film': '🎬',
    'receipt': '📱',
    'graduation-cap': '📚',
    'wallet': '💰',
    'arrow-right-left': '💸',
    'circle-help': '❓',
  };
  return emojiMap[iconName] || '💰';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  greeting: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    marginBottom: 4,
  },
  appName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xl,
  },
  monthLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
  },

  // Balance Card
  balanceCard: {
    borderRadius: borderRadius.xl,
    padding: 24,
    marginBottom: 20,
  },
  balanceLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontFamily: typography.fontFamily.monoBold,
    fontSize: 36,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceStat: {
    flex: 1,
  },
  balanceStatLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  balanceStatAmount: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.sizes.md,
    color: '#FFFFFF',
  },
  balanceDivider: {
    width: 1,
    height: 36,
    marginHorizontal: 16,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  quickActionEmoji: { fontSize: 22, marginBottom: 6 },
  quickActionLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.xs,
  },

  // Sections
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.md,
    marginBottom: 12,
  },
  seeAll: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
    marginBottom: 12,
  },

  // Category breakdown
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.base,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryAmount: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.sizes.base,
  },
  categoryPercent: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    minWidth: 32,
    textAlign: 'right',
  },
  categoryBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 12,
  },
  categoryBarSegment: {
    height: '100%',
  },

  // Transaction rows
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  txIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txIconText: { fontSize: 20 },
  txInfo: { flex: 1 },
  txMerchant: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.base,
    marginBottom: 2,
  },
  txDate: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
  },
  txAmount: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.sizes.base,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.md,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  emptyButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.sm,
  },

  // Accounts
  accountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  accountCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  accountEmoji: { fontSize: 24, marginBottom: 8 },
  accountName: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    marginBottom: 4,
  },
  accountBalance: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.sizes.md,
  },

  // FAB
  fabWrapper: {
    position: 'absolute',
    bottom: 100,
    right: 20,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
});
