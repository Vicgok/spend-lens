import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
  Platform,
  Alert,
  NativeModules,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/theme-provider';
import { typography } from '@/theme';
import { useTransactionStore } from '@/stores/transaction-store';
import { formatCurrency, formatSignedAmount } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { getCategoryById } from '@/features/categorizer/categorizer';
import { syncSMSFromDevice, startSMSListener, checkSMSPermission, requestSMSPermission } from '@/features/sms-parser/sms-reader';
import { TransactionSkeleton } from '@/components/ui/Skeleton';
import { detectImpulseSpending } from '@/features/insights-engine/detector';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);

  const {
    transactions,
    accounts,
    monthlyTotals,
    loadAccounts,
    loadTransactions,
    loadMonthlyStats,
    getTotalBalance,
    loadCategories,
    isLoading,
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
    if (Platform.OS !== 'android' || !NativeModules.RNExpoReadSms) return;
    (async () => {
      const granted = await checkSMSPermission();
      if (!granted) {
        Alert.alert(
          'Enable SMS Tracking',
          'SpendLens can automatically track your expenses by reading bank SMS messages. All processing happens on your device.',
          [
            { text: 'Not Now', style: 'cancel' },
            {
              text: 'Enable',
              onPress: async () => {
                await requestSMSPermission();
                loadData();
              },
            },
          ]
        );
      }
    })();
  }, []);

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
  
  const displayedBalance = selectedAccountId
    ? accounts.find((a) => a.id === selectedAccountId)?.balance || 0
    : totalBalance;

  const displayedTransactions = selectedAccountId
    ? transactions.filter((t) => t.accountId === selectedAccountId)
    : transactions;

  const displayedIncome = selectedAccountId
    ? displayedTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    : monthlyTotals.totalIncome;

  const displayedExpense = selectedAccountId
    ? displayedTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    : monthlyTotals.totalExpense;

  const recentTransactions = displayedTransactions.slice(0, 10); // Latest 10 as specified in UI document

  // Detect Impulse Spending activity
  const impulseSpends = detectImpulseSpending(transactions);
  const topImpulse = impulseSpends.length > 0 ? impulseSpends[0] : null;

  // Generate Financial Pulse graph points (Cumulative daily expenses for the last 7 days)
  const getPulseGraphPath = () => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    if (expenses.length === 0) return '';

    const dailyMap: { [dateStr: string]: number } = {};
    const last7Days: string[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      last7Days.push(dateStr);
      dailyMap[dateStr] = 0;
    }

    expenses.forEach((tx) => {
      const dateStr = tx.date.split('T')[0];
      if (dateStr in dailyMap) {
        dailyMap[dateStr] += tx.amount;
      }
    });

    const values = last7Days.map((d) => dailyMap[d]);
    const maxVal = Math.max(...values, 1000); // minimum scale

    // Map to width 300, height 60
    const w = width - 64; // responsive width
    const h = 60;
    const points = values.map((val, idx) => {
      const x = (idx / 6) * w;
      // Invert Y axis for screen space
      const y = h - (val / maxVal) * (h - 10) - 5;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const pulsePath = getPulseGraphPath();

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.microHeader, { color: theme.textSecondary }]}>FINANCIAL NOTEBOOK</Text>
            <Text style={[styles.mainHeader, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
              SpendLens
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.monthLabel, { color: theme.textSecondary, fontFamily: typography.fontFamily.medium, marginRight: 12 }]}>
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <Pressable
              onPress={() => router.push('/add-transaction')}
              style={({ pressed }) => [
                styles.headerAddBtn,
                { borderColor: theme.border, opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Text style={[styles.headerAddBtnText, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Section 1: Balance Overview Grid */}
        <View style={[styles.balanceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>
            {selectedAccountId ? 'ACCOUNT BALANCE' : 'AVAILABLE BALANCE'}
          </Text>
          <Text style={[styles.balanceAmount, { color: theme.text, fontFamily: typography.fontFamily.monoBold }]}>
            {formatCurrency(displayedBalance)}
          </Text>
 
          <View style={[styles.thinDivider, { backgroundColor: theme.borderLight }]} />
 
          {/* 3-Column stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statCol, { borderRightWidth: 1, borderRightColor: theme.borderLight }]}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>INCOME</Text>
              <Text style={[styles.statValue, { color: theme.income, fontFamily: typography.fontFamily.monoBold }]}>
                ₹{Math.round(displayedIncome)}
              </Text>
            </View>
            <View style={[styles.statCol, { borderRightWidth: 1, borderRightColor: theme.borderLight }]}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>EXPENSE</Text>
              <Text style={[styles.statValue, { color: theme.expense, fontFamily: typography.fontFamily.monoBold }]}>
                ₹{Math.round(displayedExpense)}
              </Text>
            </View>
            <View style={styles.statCol}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>SAVINGS</Text>
              <Text style={[styles.statValue, { color: theme.income, fontFamily: typography.fontFamily.monoBold }]}>
                ₹{Math.round(Math.max(0, displayedIncome - displayedExpense))}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 1.5: Horizontal Scrollable Accounts */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.accountsScroll}
          contentContainerStyle={styles.accountsScrollContent}
        >
          {accounts.map((acc) => {
            const isSelected = selectedAccountId === acc.id;
            return (
              <Pressable
                key={acc.id}
                onPress={() => setSelectedAccountId(isSelected ? null : acc.id)}
                style={({ pressed }) => [
                  styles.accountCardSmall,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderColor: theme.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={styles.accountCardHeader}>
                  <Text style={styles.accountCardTypeEmoji}>
                    {getAccountTypeEmoji(acc.type)}
                  </Text>
                  <Text
                    style={[
                      styles.accountCardTypeLabel,
                      { color: isSelected ? theme.textInverse : theme.textSecondary }
                    ]}
                  >
                    {acc.type.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.accountCardName,
                    {
                      color: isSelected ? theme.textInverse : theme.text,
                      fontFamily: typography.fontFamily.bold
                    }
                  ]}
                  numberOfLines={1}
                >
                  {acc.name}
                </Text>
                <Text
                  style={[
                    styles.accountCardBalance,
                    {
                      color: isSelected ? theme.textInverse : theme.text,
                      fontFamily: typography.fontFamily.monoBold
                    }
                  ]}
                >
                  {formatCurrency(acc.balance)}
                </Text>
              </Pressable>
            );
          })}

          {/* Add Account Card */}
          <Pressable
            onPress={() => router.push('/accounts')}
            style={({ pressed }) => [
              styles.accountCardSmall,
              {
                borderColor: theme.border,
                backgroundColor: theme.card,
                borderStyle: 'dashed',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 6,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 5v14" />
              <Path d="M5 12h14" />
            </Svg>
            <Text style={{ fontSize: 10, color: theme.textSecondary, fontFamily: typography.fontFamily.bold, letterSpacing: 0.5 }}>
              ADD ACCOUNT
            </Text>
          </Pressable>
        </ScrollView>

        {/* Section 2: Monthly Overview Connected Paper Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
            Monthly Overview Flow
          </Text>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            Summary showing cash flow pathways
          </Text>

          {/* Structural Line Flow Visualizer */}
          <View style={styles.flowDiagram}>
            <View style={styles.flowNode}>
              <Text style={[styles.flowLabel, { color: theme.textSecondary }]}>INCOMING</Text>
              <Text style={[styles.flowAmount, { color: theme.income, fontFamily: typography.fontFamily.monoBold }]}>
                ₹{Math.round(monthlyTotals.totalIncome)}
              </Text>
            </View>

            {/* Connecting thin vector line */}
            <View style={styles.flowConnector}>
              <View style={[styles.horizontalLine, { backgroundColor: theme.border }]} />
              <View style={[styles.verticalDot, { backgroundColor: theme.primary }]} />
            </View>

            <View style={styles.flowNode}>
              <Text style={[styles.flowLabel, { color: theme.textSecondary }]}>OUTGOING</Text>
              <Text style={[styles.flowAmount, { color: theme.expense, fontFamily: typography.fontFamily.monoBold }]}>
                ₹{Math.round(monthlyTotals.totalExpense)}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 4: Impulse Spending Detector */}
        {topImpulse && (
          <View style={[styles.card, styles.alertCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.alertHeader}>
              <Text style={[styles.alertBadge, { backgroundColor: theme.expense + '20', color: theme.expense, fontFamily: typography.fontFamily.bold }]}>
                POSSIBLE IMPULSE DETECTED
              </Text>
              {topImpulse.metric && (
                <Text style={[styles.alertMetric, { color: theme.textSecondary }]}>{topImpulse.metric}</Text>
              )}
            </View>
            <Text style={[styles.alertTitle, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
              {topImpulse.title}
            </Text>
            <Text style={[styles.alertDescription, { color: theme.textSecondary }]}>
              {topImpulse.whatHappened}
            </Text>
            {topImpulse.impactAmount && (
              <View style={[styles.impactBadge, { backgroundColor: theme.primary + '25' }]}>
                <Text style={[styles.impactText, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
                  Potential Leak Impact: ₹{topImpulse.impactAmount}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Section 5: Financial Pulse Sparkline */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
            Financial Pulse
          </Text>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            Daily spending trend (past 7 days)
          </Text>

          {pulsePath ? (
            <View style={styles.pulseGraphContainer}>
              <Svg height="60" width={width - 64}>
                <Path d={pulsePath} fill="none" stroke={theme.border} strokeWidth="1.5" />
              </Svg>
            </View>
          ) : (
            <Text style={[styles.noPulseText, { color: theme.textSecondary }]}>No recent spending data</Text>
          )}
        </View>

        {/* Section 3: Recent Transactions (Latest 10) */}
        <View style={[styles.section, { marginBottom: 120 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
              Recent Activity
            </Text>
            {transactions.length > 10 && (
              <Pressable onPress={() => router.push('/(tabs)/transactions')}>
                <Text style={[styles.seeAll, { color: theme.textSecondary, fontFamily: typography.fontFamily.bold }]}>
                  See All ➔
                </Text>
              </Pressable>
            )}
          </View>

          {isLoading ? (
            <TransactionSkeleton />
          ) : recentTransactions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No transactions yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                SMS alerts or manual entries will create transaction cards here.
              </Text>
              <Pressable
                style={[styles.emptyButton, { borderColor: theme.border }]}
                onPress={() => router.push('/add-transaction')}
              >
                <Text style={[styles.emptyButtonText, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
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
                  style={({ pressed }) => [
                    styles.transactionRow,
                    { borderBottomColor: theme.borderLight },
                    pressed && { opacity: 0.7 }
                  ]}
                  onPress={() => router.push(`/transaction/${tx.id}`)}
                >
                  <View style={[styles.txIcon, { backgroundColor: theme.primary + '20', borderColor: theme.border }]}>
                    <Text style={styles.txIconText}>
                      {getCategoryEmoji(category.icon)}
                    </Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={[styles.txMerchant, { color: theme.text, fontFamily: typography.fontFamily.bold }]} numberOfLines={1}>
                      {tx.merchant || category.name}
                    </Text>
                    <Text style={[styles.txDate, { color: theme.textSecondary }]}>
                      {formatDate(tx.date, 'short')} · {tx.source.toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: tx.type === 'income' ? theme.income : theme.expense, fontFamily: typography.fontFamily.monoBold },
                    ]}
                  >
                    {formatSignedAmount(tx.amount, tx.type)}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
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

function getAccountTypeEmoji(type: string): string {
  const map: Record<string, string> = {
    bank: '🏦',
    cash: '💵',
    credit_card: '💳',
    wallet: '📱',
  };
  return map[type] || '💰';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  headerAddBtnText: {
    fontSize: 18,
    lineHeight: 20,
    textAlign: 'center',
  },
  microHeader: {
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 4,
  },
  mainHeader: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  monthLabel: {
    fontSize: 13,
  },
  balanceCard: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    marginBottom: 16,
  },
  thinDivider: {
    height: 1,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
  },
  card: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  flowDiagram: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  flowNode: {
    alignItems: 'center',
  },
  flowLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  flowAmount: {
    fontSize: 16,
  },
  flowConnector: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 20,
    marginHorizontal: 12,
  },
  horizontalLine: {
    height: 1,
    width: '100%',
  },
  verticalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
  },
  alertCard: {
    gap: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertBadge: {
    fontSize: 10,
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
  },
  alertMetric: {
    fontSize: 12,
  },
  alertTitle: {
    fontSize: 16,
  },
  alertDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  impactBadge: {
    padding: 10,
    borderRadius: 2,
    alignSelf: 'flex-start',
  },
  impactText: {
    fontSize: 12,
  },
  pulseGraphContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  noPulseText: {
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 12,
  },
  section: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
  },
  seeAll: {
    fontSize: 13,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txIconText: { fontSize: 20 },
  txInfo: { flex: 1 },
  txMerchant: {
    fontSize: 15,
    marginBottom: 2,
  },
  txDate: {
    fontSize: 11,
  },
  txAmount: {
    fontSize: 15,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderRadius: 4,
  },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 4,
  },
  emptyButtonText: {
    fontSize: 13,
  },
  accountsScroll: {
    marginBottom: 20,
  },
  accountsScrollContent: {
    gap: 12,
    paddingRight: 16,
  },
  accountCardSmall: {
    width: 140,
    padding: 12,
    borderWidth: 1,
    borderRadius: 4,
    gap: 8,
  },
  accountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accountCardTypeEmoji: {
    fontSize: 14,
  },
  accountCardTypeLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  accountCardName: {
    fontSize: 13,
  },
  accountCardBalance: {
    fontSize: 14,
  },
});
