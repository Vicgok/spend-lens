import React, { useEffect, useCallback, useRef } from 'react';
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
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/theme-provider';
import { typography } from '@/theme';
import { useTransactionStore } from '@/stores/transaction-store';
import { formatCurrency, formatSignedAmount } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { getCategoryById } from '@/features/categorizer/categorizer';
import { syncSMSFromDevice, checkSMSPermission, requestSMSPermission } from '@/features/sms-parser/sms-reader';
import SpendLensSmsModule from '../../modules/spendlens-sms-module';
import { TransactionSkeleton } from '@/components/ui/Skeleton';
import { detectImpulseSpending } from '@/features/insights-engine/detector';
import { getPendingDetections, updateDetectionStatus, DetectedBank, writeLog } from '@/lib/database';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const logger = {
  info: (msg: string) => {
    console.log(msg);
    writeLog('TABS_TRACE', msg).catch((e) =>
      console.warn('[logger] Failed to write trace log:', e)
    );
  },
  error: (msg: string, err?: any) => {
    console.error(msg, err);
    writeLog('TABS_ERROR', `${msg}: ${err?.message || String(err)}`, {
      error: err?.message,
    }).catch((e) => console.warn('[logger] Failed to write error log:', e));
  },
};

export default function DashboardScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);
  const [pendingBanks, setPendingBanks] = React.useState<DetectedBank[]>([]);
  const [addingBank, setAddingBank] = React.useState<DetectedBank | null>(null);
  const [initialBalance, setInitialBalance] = React.useState('');
  const [isAppReady, setIsAppReady] = React.useState(false);

  // Ref to track whether SMS has been initialized (prevent double-init on re-renders)
  const smsInitialized = useRef(false);

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

  // ─── Step 1: Load DB data only (no SMS) ───────────────────────────────────
  const loadData = useCallback(async () => {
    logger.info('[TABS_INIT]');

    try {
      const detections = await getPendingDetections();
      setPendingBanks(detections);
    } catch (e) {
      console.warn('Failed to load pending bank detections:', e);
    }

    try {
      await loadAccounts();
      logger.info('[TABS_ACCOUNTS_LOADED]');

      await loadTransactions();
      logger.info('[TABS_TRANSACTIONS_LOADED]');

      await Promise.all([
        loadMonthlyStats(),
        loadCategories(),
      ]);

      setIsAppReady(true);
      logger.info('[TABS_READY]');
    } catch (err: any) {
      logger.error('[TABS_RENDER_ERROR]', err);
    }
  }, []); // Stable store actions do not change reference

  // ─── Step 2: SMS Initialization – deferred 3s after TABS_READY ───────────
  const initializeSMS = useCallback(async () => {
    if (smsInitialized.current) return;
    smsInitialized.current = true;

    logger.info('[SMS_NATIVE_INIT] SMS initialization starting');

    // 2a. Historical sync
    try {
      logger.info('[SMS_NATIVE_SYNC] Starting syncSMSFromDevice');
      const count = await syncSMSFromDevice();
      logger.info(`[SMS_NATIVE_SYNC] syncSMSFromDevice completed, added ${count} transactions`);

      if (count > 0) {
        // Reload data to reflect newly synced transactions
        try {
          await loadAccounts();
          await loadTransactions();
          await Promise.all([loadMonthlyStats(), loadCategories()]);
          const detections = await getPendingDetections();
          setPendingBanks(detections);
        } catch (reloadErr: any) {
          logger.error('[SMS_NATIVE_SYNC] Reload after sync failed', reloadErr);
        }
      }
    } catch (error: any) {
      logger.error('[SMS_NATIVE_FATAL] syncSMSFromDevice threw', error);
    }

    // 2b. Permission prompt (Android only, native module present)
    if (Platform.OS === 'android' && SpendLensSmsModule) {
      try {
        logger.info('[SMS_NATIVE_PERMISSION] Checking SMS permission');
        const granted = await checkSMSPermission();
        logger.info(`[SMS_NATIVE_PERMISSION] Permission granted: ${granted}`);

        if (!granted) {
          Alert.alert(
            'Enable SMS Tracking',
            'SpendLens can automatically track your expenses by reading bank SMS messages. All processing happens on your device.',
            [
              { text: 'Not Now', style: 'cancel' },
              {
                text: 'Enable',
                onPress: async () => {
                  try {
                    logger.info('[SMS_NATIVE_PERMISSION] Requesting SMS permission');
                    await requestSMSPermission();
                    logger.info('[SMS_NATIVE_PERMISSION] Permission request completed');
                    await loadData();
                  } catch (permErr: any) {
                    logger.error('[SMS_NATIVE_PERMISSION] requestSMSPermission failed', permErr);
                  }
                },
              },
            ]
          );
        }
      } catch (permCheckErr: any) {
        logger.error('[SMS_NATIVE_PERMISSION] checkSMSPermission threw', permCheckErr);
      }
    }

    logger.info('[SMS_NATIVE_INIT] SMS initialization complete');
  }, [loadData, loadAccounts, loadTransactions, loadMonthlyStats, loadCategories]);

  // ─── Effects ──────────────────────────────────────────────────────────────

  // Load DB data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Defer SMS init 3 seconds after mount so navigation is fully settled
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeSMS();
    }, 3000);
    return () => clearTimeout(timer);
  }, [initializeSMS]);


  // SMS live listener is handled natively by SmsReceiver in AndroidManifest
  // No JS-side listener needed (was causing native crashes via @maniac-tech library)

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleIgnoreBank = async (bankId: string) => {
    try {
      await updateDetectionStatus(bankId, 'ignored');
      setPendingBanks((prev) => prev.filter((b) => b.bankId !== bankId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAccount = async () => {
    if (!addingBank) return;
    const balance = parseFloat(initialBalance.replace(/,/g, '')) || 0;
    try {
      await useTransactionStore.getState().createAccount({
        name: addingBank.bankName,
        type: 'bank',
        balance,
        currency: 'INR',
        icon: '🏦',
        bankId: addingBank.bankId,
      });
      await updateDetectionStatus(addingBank.bankId, 'tracked');
      setPendingBanks((prev) => prev.filter((b) => b.bankId !== addingBank.bankId));
      setAddingBank(null);
      setInitialBalance('');
      await loadData();
      Alert.alert('Account Added', `Account for ${addingBank.bankName} added successfully.`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add account.');
    }
  };

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

  if (!isAppReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary, fontFamily: typography.fontFamily.medium }]}>
          Loading your financial observatory...
        </Text>
      </View>
    );
  }

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
              SpendLens v1.0.2
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

        {/* Pending Bank Detections Alert Card */}
        {pendingBanks.map((bank) => (
          <View
            key={bank.bankId}
            style={[
              styles.detectionCard,
              { backgroundColor: theme.card, borderColor: theme.border }
            ]}
          >
            <View style={styles.detectionHeader}>
              <Text style={styles.detectionIcon}>🏦</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detectionTitle, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
                  New Bank Found
                </Text>
                <Text style={[styles.detectionDesc, { color: theme.textSecondary }]}>
                  {bank.bankName} transactions were detected. Track this account?
                </Text>
              </View>
            </View>
            <View style={styles.detectionActions}>
              <Pressable
                onPress={() => setAddingBank(bank)}
                style={({ pressed }) => [
                  styles.detectionBtn,
                  { backgroundColor: theme.primary, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <Text style={[styles.detectionBtnText, { color: '#1B1B1B', fontFamily: typography.fontFamily.bold }]}>
                  Add Account
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleIgnoreBank(bank.bankId)}
                style={({ pressed }) => [
                  styles.detectionBtnIgnore,
                  { borderColor: theme.border, opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <Text style={[styles.detectionBtnTextIgnore, { color: theme.textSecondary, fontFamily: typography.fontFamily.bold }]}>
                  Ignore
                </Text>
              </Pressable>
            </View>
          </View>
        ))}

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

      {/* Modal for adding bank account from detection */}
      <Modal
        visible={addingBank !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddingBank(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
                Add {addingBank?.bankName} Account
              </Text>
              <Pressable onPress={() => setAddingBank(null)} style={styles.modalCloseButton}>
                <Text style={[styles.modalCloseText, { color: theme.textSecondary }]}>✕</Text>
              </Pressable>
            </View>

            <View style={{ paddingHorizontal: 24, gap: 16, marginTop: 16 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 20 }}>
                Set the starting balance for this account to begin tracking. Transactions will be backfilled automatically.
              </Text>

              <View style={[styles.inputContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                <Text style={[styles.currencySymbol, { color: theme.primary }]}>₹</Text>
                <TextInput
                  style={[styles.balanceInput, { color: theme.text }]}
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                  value={initialBalance}
                  onChangeText={setInitialBalance}
                  autoFocus={true}
                />
              </View>

              <Pressable
                onPress={handleAddAccount}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: theme.primary, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <Text style={{ color: '#1B1B1B', fontFamily: typography.fontFamily.bold, fontSize: 15 }}>
                  Add Account
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
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
    fontSize: 18,
  },
  flowConnector: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    marginHorizontal: 8,
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
    top: -2.5,
  },
  alertCard: {},
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertBadge: {
    fontSize: 9,
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  alertMetric: {
    fontSize: 11,
  },
  alertTitle: {
    fontSize: 15,
    marginBottom: 6,
  },
  alertDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  impactBadge: {
    marginTop: 12,
    padding: 10,
    borderRadius: 4,
  },
  impactText: {
    fontSize: 13,
  },
  pulseGraphContainer: {
    marginTop: 4,
  },
  noPulseText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
  },
  seeAll: {
    fontSize: 13,
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyButton: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyButtonText: {
    fontSize: 14,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIconText: {
    fontSize: 16,
  },
  txInfo: {
    flex: 1,
  },
  txMerchant: {
    fontSize: 14,
    marginBottom: 2,
  },
  txDate: {
    fontSize: 11,
  },
  txAmount: {
    fontSize: 14,
  },
  accountsScroll: {
    marginBottom: 20,
  },
  accountsScrollContent: {
    gap: 10,
    paddingRight: 8,
  },
  accountCardSmall: {
    width: 130,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  accountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
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
    marginTop: 2,
  },
  detectionCard: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  detectionHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  detectionIcon: {
    fontSize: 20,
  },
  detectionTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  detectionDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  detectionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  detectionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectionBtnText: {
    fontSize: 13,
  },
  detectionBtnIgnore: {
    flex: 1,
    height: 40,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectionBtnTextIgnore: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 17,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
  },
  currencySymbol: {
    fontSize: 20,
    marginRight: 8,
    fontWeight: '700',
  },
  balanceInput: {
    flex: 1,
    fontSize: 20,
    padding: 0,
  },
  submitBtn: {
    height: 50,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
