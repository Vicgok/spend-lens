import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '@/theme';
import { useTransactionStore } from '@/stores/transaction-store';
import { formatCurrency } from '@/utils/currency';
import { syncSMSFromDevice, checkSMSPermission, requestSMSPermission } from '@/features/sms-parser/sms-reader';
import SpendLensSmsModule from '../../modules/spendlens-sms-module';
import { getPendingDetections, updateDetectionStatus, DetectedBank, writeLog } from '@/lib/database';
import Svg, { Path, Rect, Circle, Line, Ellipse } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { AccountIcon } from '@/components/ui/BankLogo';
import SproutCoinMascot from '@/components/ui/SproutCoinMascot';
import SavingsJarIllustration from '@/components/ui/SavingsJarIllustration';
import CardLeafIllustration from '@/components/ui/CardLeafIllustration';
import AccountCardIllustration from '@/components/ui/AccountCardIllustration';
import NotebookIllustration from '@/components/ui/NotebookIllustration';
import QuickOverviewLeafIllustration from '@/components/ui/QuickOverviewLeafIllustration';
import MascotWaiting from '@/components/ui/MascotWaiting';
import InsightMascotIllustration from '@/components/ui/InsightMascotIllustration';
import AddFinancialSourceSheet from '@/components/ui/AddFinancialSourceSheet';
import { AccountType } from '@/types';

function getAccountTypeLabel(type: string): string {
  const map: Record<string, string> = {
    bank: 'Savings Account',
    cash: 'Cash Account',
    credit_card: 'Credit Card',
    wallet: 'Digital Wallet',
  };
  return map[type] || 'Savings Account';
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    return 'Good morning';
  } else if (hour >= 11 && hour < 13) {
    return 'Happy brunch';
  } else if (hour >= 13 && hour < 17) {
    return 'Good afternoon';
  } else if (hour >= 17 && hour < 22) {
    return 'Good evening';
  } else {
    return 'Good night';
  }
}

function getFormattedMonth(): string {
  const date = new Date();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

const COLOR_FOREST_GREEN = '#3E5A2A';
const COLOR_DEEP_BROWN = '#745143';
const COLOR_ACCENT_BROWN = '#B7884E';
const COLOR_PAPER_WHITE = '#FDFDFB';
const COLOR_BACKGROUND = '#F6F3EC';
const COLOR_BORDER = '#E6E1D8';
const COLOR_MUTED_TEXT = '#8E8A82';

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



const ChevronRight = React.memo(() => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={COLOR_DEEP_BROWN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 18l6-6-6-6" />
  </Svg>
));



const UnusualSpendingIcon = React.memo(() => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={COLOR_FOREST_GREEN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 12h3l3-9 6 18 3-9h3" />
  </Svg>
));

const UpcomingBillsIcon = React.memo(() => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={COLOR_ACCENT_BROWN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
    <Line x1={16} y1={2} x2={16} y2={6} />
    <Line x1={8} y1={2} x2={8} y2={6} />
    <Line x1={3} y1={10} x2={21} y2={10} />
  </Svg>
));

const MoneyLeaksIcon = React.memo(() => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={COLOR_FOREST_GREEN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Svg>
));

const CashIcon = React.memo(({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={COLOR_FOREST_GREEN} strokeWidth={1.8}>
    <Rect x={2} y={6} width={20} height={12} rx={2} />
    <Circle cx={12} cy={12} r={3} />
    <Path d="M6 12h.01M18 12h.01" strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
));

const BankIcon = React.memo(({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={COLOR_DEEP_BROWN} strokeWidth={1.8}>
    <Path d="M3 21h18M3 10h18M3 10l9-7 9 7M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
  </Svg>
));

const SnapshotArrow = React.memo(() => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={COLOR_DEEP_BROWN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14M12 5l7 7-7 7" />
  </Svg>
));

// ─── Dashboard Screen ─────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);
  const [pendingBanks, setPendingBanks] = React.useState<DetectedBank[]>([]);
  const [addingBank, setAddingBank] = React.useState<DetectedBank | null>(null);
  const [initialBalance, setInitialBalance] = React.useState('');
  const [isAppReady, setIsAppReady] = React.useState(false);
  const [initError, setInitError] = React.useState<string | null>(null);

  // Grouped custom account form states
  const [isAddingCustomAccount, setIsAddingCustomAccount] = React.useState(false);

  const smsInitialized = useRef(false);

  const {
    accounts,
    monthlyTotals,
    loadAccounts,
    loadTransactions,
    loadMonthlyStats,
    loadCategories,
  } = useTransactionStore();

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
      setInitError(err.message || String(err));
    }
  }, [loadAccounts, loadTransactions, loadMonthlyStats, loadCategories]);

  const initializeSMS = useCallback(async () => {
    if (smsInitialized.current) return;
    smsInitialized.current = true;

    logger.info('[SMS_NATIVE_INIT] SMS initialization starting');

    try {
      logger.info('[SMS_NATIVE_SYNC] Starting syncSMSFromDevice');
      const count = await syncSMSFromDevice();
      logger.info(`[SMS_NATIVE_SYNC] syncSMSFromDevice completed, added ${count} transactions`);

      if (count > 0) {
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      initializeSMS();
    }, 3000);
    return () => clearTimeout(timer);
  }, [initializeSMS]);

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

  const handleCreateCustomAccount = async (payload: { type: AccountType; bankId?: string; startingBalance: number }) => {
    let name = '';
    let icon = '🏦';
    let color = '#004C8F';

    if (payload.type === 'bank') {
      const bankNameMap: Record<string, string> = {
        hdfc: 'HDFC Bank',
        icici: 'ICICI Bank',
        axis: 'Axis Bank',
        sbi: 'State Bank of India',
        kotak: 'Kotak Mahindra Bank',
      };
      name = bankNameMap[payload.bankId || ''] || 'Bank Account';
      icon = '🏦';
      
      const bankColorMap: Record<string, string> = {
        hdfc: '#004C8F',
        icici: '#B02A30',
        axis: '#800020',
        sbi: '#0038A8',
        kotak: '#EC1C24',
      };
      color = bankColorMap[payload.bankId || ''] || '#004C8F';
    } else if (payload.type === 'wallet') {
      name = 'Digital Wallet';
      icon = '📱';
      color = '#00B9F1';
    } else if (payload.type === 'cash') {
      name = 'Cash';
      icon = '💵';
      color = '#3E5A2A';
    } else if (payload.type === 'credit_card') {
      name = 'Credit Card';
      icon = '💳';
      color = '#745143';
    }

    try {
      await useTransactionStore.getState().createAccount({
        name,
        type: payload.type,
        balance: payload.startingBalance,
        currency: 'INR',
        icon,
        color,
        bankId: payload.bankId,
      });

      setIsAddingCustomAccount(false);
      await loadData();
      Alert.alert('Account Added', `Account for ${name} added successfully.`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add account.');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Construct stacked accounts matching user entered data only
  const displayAccounts = [...accounts];

  // Dynamic stack logic based on selectedAccountId
  const currentSelectedId = selectedAccountId || (displayAccounts[0] ? displayAccounts[0].id : null);
  let orderedAccounts = [...displayAccounts];
  if (currentSelectedId) {
    const selectedIdx = orderedAccounts.findIndex((a) => a.id === currentSelectedId);
    if (selectedIdx > -1) {
      const selectedAcc = orderedAccounts[selectedIdx];
      orderedAccounts.splice(selectedIdx, 1);
      orderedAccounts.unshift(selectedAcc);
    }
  }

  const previewAccounts = orderedAccounts.slice(0, 3);

  // Calculate dynamic balances
  const activeBalanceTotal = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const displayedTotalBalance = displayAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  const totalIncome = monthlyTotals?.totalIncome || 0;
  const totalExpense = monthlyTotals?.totalExpense || 0;
  const totalSavings = Math.max(0, totalIncome - totalExpense);

  if (!isAppReady) {
    return (
      <View style={styles.loadingContainer}>
        {initError ? (
          <>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#C84B31', marginBottom: 12 }}>
              Initialization Failure
            </Text>
            <Text style={{ fontSize: 14, color: COLOR_DEEP_BROWN, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 }}>
              {initError}
            </Text>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={COLOR_DEEP_BROWN} />
            <Text style={styles.loadingText}>
              Opening your financial notebook...
            </Text>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLOR_DEEP_BROWN} />
        }
      >
        {/* Header Block */}
        <View style={styles.headerBlock}>
          {/* Row 1: FINANCIAL NOTEBOOK & Date + Add Button */}
          <View style={styles.headerRow1}>
            <Text style={styles.microHeader}>FINANCIAL NOTEBOOK</Text>
            <View style={styles.headerRow1Right}>
              <Text style={styles.monthLabel}>{getFormattedMonth()}</Text>
              <Pressable
                onPress={() => router.push('/add-transaction')}
                style={({ pressed }) => [
                  styles.headerAddBtn,
                  { opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <Text style={styles.headerAddBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* Row 2: SpendLens Title & version tag */}
          <View style={styles.headerRow2}>
            <Text style={styles.mainHeader}>
              SpendLens <Text style={styles.versionText}>v1.0.2</Text>
            </Text>
          </View>

          {/* Row 3: Greeting & Mascot */}
          <View style={styles.headerRow3}>
            <Text style={styles.subtitle}>
              {getTimeOfDayGreeting()}! Your finances look{' '}
              <Text style={{ color: COLOR_FOREST_GREEN, fontWeight: 'bold' }}>calm and under control</Text>.
            </Text>
            <View style={styles.topMascotContainer}>
              <SproutCoinMascot width={90} height={75} />
            </View>
          </View>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroMainRow}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroLabel}>AVAILABLE BALANCE</Text>
              <Text style={styles.heroAmount}>
                {formatCurrency(activeBalanceTotal)}
              </Text>

              {/* Status Chip */}
              <View style={styles.statusChip}>
                <View style={styles.statusDot} />
                <Text style={styles.statusChipText}>Everything looks good</Text>
              </View>
            </View>
            <View style={styles.heroRight}>
              <SavingsJarIllustration />
            </View>
          </View>

          <View style={styles.thinDivider} />

          {/* 3 Column Grid */}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>INCOME</Text>
              <Text style={[styles.statValue, { color: COLOR_FOREST_GREEN }]}>
                {formatCurrency(totalIncome)}
              </Text>
            </View>
            <View style={[styles.statCol, { borderLeftWidth: 1, borderLeftColor: COLOR_BORDER, borderRightWidth: 1, borderRightColor: COLOR_BORDER }]}>
              <Text style={styles.statLabel}>EXPENSE</Text>
              <Text style={[styles.statValue, { color: '#B7884E' }]}>
                {formatCurrency(totalExpense)}
              </Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>SAVINGS</Text>
              <Text style={[styles.statValue, { color: COLOR_FOREST_GREEN }]}>
                {formatCurrency(totalSavings)}
              </Text>
            </View>
          </View>
        </View>

        {/* Pending Bank Banner */}
        {pendingBanks.length > 0 && (
          <Pressable
            onPress={() => setAddingBank(pendingBanks[0])}
            style={styles.pendingBankBanner}
          >
            <Text style={styles.pendingBankBannerText}>
              ⚠️ Detected new account from {pendingBanks[0].bankName}. Tap to setup tracking →
            </Text>
          </Pressable>
        )}

        {/* Quick Overview Section */}
        <Text style={styles.sectionHeading}>QUICK OVERVIEW</Text>
        <View style={styles.overviewContainer}>
          {/* Card 1 */}
          <View style={styles.insightCard}>
            <View style={[styles.insightIconWrapper, { backgroundColor: 'rgba(62, 90, 42, 0.06)' }]}>
              <UnusualSpendingIcon />
            </View>
            <Text style={styles.insightTitle}>No unusual spending</Text>
            <Text style={[styles.insightSubtext, { color: COLOR_FOREST_GREEN }]}>Great job!</Text>
            <QuickOverviewLeafIllustration />
          </View>

          {/* Card 2 */}
          <View style={styles.insightCard}>
            <View style={[styles.insightIconWrapper, { backgroundColor: 'rgba(183, 136, 78, 0.06)' }]}>
              <UpcomingBillsIcon />
            </View>
            <Text style={styles.insightTitle}>No upcoming bills</Text>
            <Text style={[styles.insightSubtext, { color: COLOR_ACCENT_BROWN }]}>You're all set</Text>
            <QuickOverviewLeafIllustration />
          </View>

          {/* Card 3 */}
          <View style={styles.insightCard}>
            <View style={[styles.insightIconWrapper, { backgroundColor: 'rgba(62, 90, 42, 0.06)' }]}>
              <MoneyLeaksIcon />
            </View>
            <Text style={styles.insightTitle}>No money leaks detected</Text>
            <Text style={[styles.insightSubtext, { color: COLOR_FOREST_GREEN }]}>You're safe</Text>
            <QuickOverviewLeafIllustration />
          </View>
        </View>

        {/* Accounts Section */}
        <View style={styles.accountsHeader}>
          <Text style={styles.accountsSectionTitle}>ACCOUNTS</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/accounts');
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={styles.viewAllText}>View all  {'>'}</Text>
          </Pressable>
        </View>

        {/* Accounts List Card */}
        <View style={styles.accountsParentCard}>
          <View style={styles.accountStackContainer}>
            {previewAccounts.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: 13, color: COLOR_MUTED_TEXT }}>
                  No accounts connected yet.
                </Text>
                <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: 11, color: COLOR_MUTED_TEXT, textAlign: 'center', paddingHorizontal: 20 }}>
                  Tap "Add Account" below to start tracking your balances.
                </Text>
              </View>
            ) : (
              <>
                {previewAccounts[2] && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedAccountId(previewAccounts[2].id);
                    }}
                    style={[styles.stackCard, styles.backCard]}
                  >
                    <View style={styles.peekContent}>
                      <AccountIcon
                        bankId={previewAccounts[2].bankId}
                        accountType={previewAccounts[2].type}
                        icon={previewAccounts[2].icon}
                        color={previewAccounts[2].color}
                        size={14}
                      />
                      <Text style={styles.peekTitle} numberOfLines={1}>
                        {previewAccounts[2].name}
                      </Text>
                    </View>
                  </Pressable>
                )}

                {previewAccounts[1] && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedAccountId(previewAccounts[1].id);
                    }}
                    style={[styles.stackCard, styles.middleCard]}
                  >
                    <View style={styles.peekContent}>
                      <AccountIcon
                        bankId={previewAccounts[1].bankId}
                        accountType={previewAccounts[1].type}
                        icon={previewAccounts[1].icon}
                        color={previewAccounts[1].color}
                        size={14}
                      />
                      <Text style={styles.peekTitle} numberOfLines={1}>
                        {previewAccounts[1].name}
                      </Text>
                    </View>
                  </Pressable>
                )}

                {previewAccounts[0] && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/accounts');
                    }}
                    style={({ pressed }) => [
                      styles.stackCard,
                      styles.frontCard,
                      {
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        transform: [{ scale: pressed ? 0.985 : 1.0 }]
                      }
                    ]}
                  >
                    <View style={styles.cardLeft}>
                      <View style={{ marginRight: 6 }}>
                        <AccountIcon
                          bankId={previewAccounts[0].bankId}
                          accountType={previewAccounts[0].type}
                          icon={previewAccounts[0].icon}
                          color={previewAccounts[0].color}
                          size={36}
                        />
                      </View>
                      <Text style={styles.cardAccountName}>{previewAccounts[0].name}</Text>
                    </View>
                    <View style={styles.cardRight}>
                      <View style={styles.balanceColumn}>
                        <Text style={styles.availableBalanceLabel}>Available Balance</Text>
                        <Text style={styles.cardBalanceText}>{formatCurrency(previewAccounts[0].balance)}</Text>
                      </View>
                      <ChevronRight />
                    </View>
                    <CardLeafIllustration />
                  </Pressable>
                )}
              </>
            )}
          </View>

          {/* Add Account Card */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsAddingCustomAccount(true);
            }}
            style={({ pressed }) => [
              styles.addAccountCard,
              { transform: [{ scale: pressed ? 0.99 : 1 }] }
            ]}
          >
            <View style={styles.addAccountContent}>
              <Text style={styles.addAccountPlus}>+</Text>
              <Text style={styles.addAccountLabel}>Add Account</Text>
            </View>
            <CardLeafIllustration />
          </Pressable>
        </View>

        {/* Today's Snapshot Card */}
        <Text style={styles.sectionHeading}>TODAY'S SNAPSHOT</Text>
        <View style={styles.snapshotCard}>
          <View style={styles.snapshotMascot}>
            <NotebookIllustration />
          </View>
          <View style={styles.snapshotContent}>
            <Text style={styles.snapshotTextTitle}>No transactions yet today.</Text>
            <Text style={styles.snapshotTextBody}>
              We'll start showing your spending insights here as activity arrives.
            </Text>
          </View>
          <Pressable style={styles.snapshotArrowBtn}>
            <SnapshotArrow />
          </Pressable>
        </View>

        {/* Financial Insight Card */}
        <Text style={styles.sectionHeading}>FINANCIAL INSIGHT</Text>
        <View style={styles.insightBanner}>
          <View style={styles.insightBannerContent}>
            <Text style={styles.insightBannerText}>
              The more you use SpendLens, {'\n'}the <Text style={{ color: COLOR_FOREST_GREEN, fontWeight: 'bold' }}>smarter insights</Text> we'll provide.
            </Text>
            <Text style={styles.insightBannerSubtext}>
              Keep your SMS reading on!
            </Text>
          </View>
          <View style={styles.insightMascot}>
            <InsightMascotIllustration />
          </View>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add {addingBank?.bankName} Account
              </Text>
              <Pressable onPress={() => setAddingBank(null)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={{ paddingHorizontal: 24, gap: 16, marginTop: 16 }}>
              <Text style={{ color: COLOR_MUTED_TEXT, fontSize: 14, lineHeight: 20 }}>
                Set the starting balance for this account to begin tracking. Transactions will be backfilled automatically.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.balanceInput}
                  placeholder="0"
                  placeholderTextColor="rgba(116, 81, 67, 0.4)"
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
                  { opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <Text style={styles.submitBtnText}>
                  Add Account
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for adding custom bank account directly on the home screen */}
      <AddFinancialSourceSheet
        visible={isAddingCustomAccount}
        onClose={() => setIsAddingCustomAccount(false)}
        onCreate={handleCreateCustomAccount}
        disabledTypes={accounts.reduce<AccountType[]>((acc, a) => {
          if (a.type === 'cash' && !acc.includes('cash')) acc.push('cash');
          if (a.type === 'credit_card' && !acc.includes('credit_card')) acc.push('credit_card');
          return acc;
        }, [])}
        existingBankIds={accounts.map(a => a.bankId).filter((id): id is string => !!id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR_BACKGROUND,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 160,
  },
  headerBlock: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  headerRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerRow1Right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRow2: {
    marginBottom: 6,
  },
  microHeader: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: COLOR_MUTED_TEXT,
    textTransform: 'uppercase',
  },
  mainHeader: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 26,
    color: COLOR_DEEP_BROWN,
  },
  versionText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: COLOR_MUTED_TEXT,
  },
  headerRow3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: COLOR_DEEP_BROWN,
    flex: 1,
  },
  monthLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
    color: COLOR_DEEP_BROWN,
  },
  headerAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLOR_DEEP_BROWN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAddBtnText: {
    color: '#FFF8EE',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: 'bold',
  },
  topMascotContainer: {
    width: 90,
    height: 75,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero Card
  heroCard: {
    backgroundColor: COLOR_PAPER_WHITE,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 28,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#745143',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  heroMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1.2,
  },
  heroLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 10,
    color: COLOR_MUTED_TEXT,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroAmount: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 34,
    color: COLOR_DEEP_BROWN,
    marginBottom: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1EFEB',
    borderWidth: 1,
    borderColor: 'rgba(62, 90, 42, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLOR_FOREST_GREEN,
  },
  statusChipText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 10,
    color: COLOR_FOREST_GREEN,
  },
  heroRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  thinDivider: {
    height: 1,
    backgroundColor: COLOR_BORDER,
    marginVertical: 14,
    opacity: 0.6,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 9,
    color: COLOR_MUTED_TEXT,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontFamily: typography.fontFamily.monoBold,
    fontSize: 16,
  },

  // Pending bank banner
  pendingBankBanner: {
    backgroundColor: COLOR_PAPER_WHITE,
    borderWidth: 1,
    borderColor: COLOR_ACCENT_BROWN,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    borderStyle: 'dashed',
  },
  pendingBankBannerText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    color: COLOR_ACCENT_BROWN,
    textAlign: 'center',
  },

  // Section Heading
  sectionHeading: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: COLOR_DEEP_BROWN,
    marginBottom: 10,
  },

  // Overview insights section
  overviewContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  insightCard: {
    flex: 1,
    backgroundColor: COLOR_PAPER_WHITE,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 14,
    padding: 10,
    alignItems: 'flex-start',
    gap: 4,
    minHeight: 100,
  },
  insightIconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 11,
    lineHeight: 14,
    color: COLOR_DEEP_BROWN,
    marginTop: 2,
  },
  insightSubtext: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 9,
  },

  // Accounts Section
  accountsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  accountsSectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: COLOR_DEEP_BROWN,
  },
  viewAllText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    color: COLOR_FOREST_GREEN,
  },
  accountsParentCard: {
    backgroundColor: COLOR_PAPER_WHITE,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 28,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#745143',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
    overflow: 'hidden',
  },
  accountStackContainer: {
    height: 150,
    position: 'relative',
  },
  stackCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8DFD1',
    overflow: 'hidden',
  },
  backCard: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 42,
    zIndex: 1,
    backgroundColor: '#F5F0E6',
  },
  middleCard: {
    position: 'absolute',
    top: 18,
    left: 12,
    right: 12,
    height: 42,
    zIndex: 2,
    backgroundColor: '#F8F4EC',
  },
  frontCard: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    minHeight: 92,
    zIndex: 3,
    backgroundColor: '#FFF8EE',
    shadowColor: '#745143',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  peekContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 3,
    height: 20, // keeps it thin inside the 18px visible space
  },
  peekTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    color: COLOR_DEEP_BROWN,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bankIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAccountName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
    color: COLOR_DEEP_BROWN,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceColumn: {
    alignItems: 'flex-end',
  },
  availableBalanceLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 9,
    color: COLOR_MUTED_TEXT,
    letterSpacing: 0.2,
    marginBottom: 1,
  },
  cardBalanceText: {
    fontFamily: typography.fontFamily.monoBold,
    fontSize: 16,
    color: COLOR_DEEP_BROWN,
  },
  addAccountCard: {
    marginTop: 10,
    height: 52,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E0D6CA',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 248, 238, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAccountContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addAccountPlus: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    color: COLOR_FOREST_GREEN,
  },
  addAccountLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
    color: COLOR_FOREST_GREEN,
    letterSpacing: 0.3,
  },

  // Snapshot Card
  snapshotCard: {
    backgroundColor: COLOR_PAPER_WHITE,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 28,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    shadowColor: '#745143',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  snapshotMascot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotContent: {
    flex: 1,
    paddingRight: 4,
  },
  snapshotTextTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 12,
    color: COLOR_DEEP_BROWN,
    marginBottom: 2,
  },
  snapshotTextBody: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    lineHeight: 15,
    color: COLOR_MUTED_TEXT,
  },
  snapshotArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Insight Banner
  insightBanner: {
    backgroundColor: COLOR_PAPER_WHITE,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#745143',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  insightBannerContent: {
    flex: 1.2,
  },
  insightBannerText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    lineHeight: 18,
    color: COLOR_DEEP_BROWN,
  },
  insightBannerSubtext: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    color: COLOR_MUTED_TEXT,
    marginTop: 4,
  },
  insightMascot: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  // Loading container
  loadingContainer: {
    flex: 1,
    backgroundColor: COLOR_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    letterSpacing: 0.5,
    color: COLOR_DEEP_BROWN,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLOR_PAPER_WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1.5,
    borderColor: COLOR_DEEP_BROWN,
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
    fontFamily: typography.fontFamily.bold,
    fontSize: 17,
    color: COLOR_DEEP_BROWN,
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
    color: COLOR_MUTED_TEXT,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: COLOR_DEEP_BROWN,
    backgroundColor: COLOR_PAPER_WHITE,
  },
  currencySymbol: {
    fontSize: 20,
    marginRight: 8,
    fontWeight: '700',
    color: COLOR_DEEP_BROWN,
  },
  balanceInput: {
    flex: 1,
    fontSize: 20,
    padding: 0,
    color: COLOR_DEEP_BROWN,
  },
  submitBtn: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLOR_DEEP_BROWN,
    backgroundColor: COLOR_FOREST_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    // Flat shadow
    shadowColor: COLOR_DEEP_BROWN,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  submitBtnText: {
    color: COLOR_PAPER_WHITE,
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
  },
});
