import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert, LayoutAnimation, Modal, RefreshControl, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '@/theme';
import { StatusBar } from 'expo-status-bar';
import { useTransactionStore } from '@/stores/transaction-store';
import { generateAllInsights } from '@/features/insights-engine/detector';
import { calculateSalarySurvivalScore } from '@/features/insights-engine/formulas';
import Svg, { Circle, Path, Line, Rect, Polyline } from 'react-native-svg';
import { Transaction } from '@/types';

// Illustrations & Mascots
import { TabHeader, ReadingNotebookMascot, CornerPlant } from '@/components/ui';

const SCAN_STEPS = [
  { message: 'INITIALIZING SMS OBSERVATORY SERVICE...', progress: 0.1 },
  { message: 'SCANNING DEVICE INBOX FOR FINANCIAL SMS METADATA...', progress: 0.3 },
  { message: 'IDENTIFYING SENDER CHANNELS (SBIINB, HDFCBK, AXISBK)...', progress: 0.5 },
  { message: 'EXTRACTING TRANSACTION AMOUNTS, MERCHANTS, AND HASHES...', progress: 0.7 },
  { message: 'RUNNING BEHAVIORAL DETECTORS (IMPULSE, LEAKS, SUBSCRIPTIONS)...', progress: 0.9 },
  { message: 'INVESTIGATION COMPLETE. UPDATING BOARD IN REAL-TIME.', progress: 1.0 },
];

// Reusable SVG Icons (No Emojis allowed by Rules)
const ShieldIcon = React.memo(({ size = 18, color = '#3E5A2A' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Svg>
));

const GraphUpIcon = React.memo(({ size = 18, color = '#3E5A2A' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M23 6l-9.5 9.5-5-5L1 18" />
    <Path d="M17 6h6v6" />
  </Svg>
));

const CalendarIcon = React.memo(({ size = 16, color = '#54554B' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <Line x1="16" y1="2" x2="16" y2="6" />
    <Line x1="8" y1="2" x2="8" y2="6" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
));

const PercentIcon = React.memo(({ size = 16, color = '#54554B' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="19" y1="5" x2="5" y2="19" />
    <Circle cx="6.5" cy="6.5" r="2.5" />
    <Circle cx="17.5" cy="17.5" r="2.5" />
  </Svg>
));

const ClockIcon = React.memo(({ size = 16, color = '#54554B' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
));

const ChatIcon = React.memo(({ size = 18, color = '#3E5A2A' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </Svg>
));

const TagIcon = React.memo(({ size = 18, color = '#3E5A2A' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <Line x1="7" y1="7" x2="7.01" y2="7" strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
));

const PulseIcon = React.memo(({ size = 18, color = '#3E5A2A' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </Svg>
));

const LeafIcon = React.memo(({ size = 14, color = '#3E5A2A' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 22C2 22 8 20 12 16C16 12 22 6 22 2C22 2 16 2 12 6C8 10 2 16 2 22Z" />
    <Path d="M2 22L12 12" />
  </Svg>
));

const BulbIcon = React.memo(({ size = 20, color = '#3E5A2A' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <Path d="M9 18h6" />
    <Path d="M10 22h4" />
  </Svg>
));

const InfoIcon = React.memo(({ size = 16, color = '#B7884E' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="16" x2="12" y2="12" />
    <Line x1="12" y1="8" x2="12.01" y2="8" strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
));

const FoodIcon = React.memo(({ size = 18, color = '#B7884E' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <Path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <Path d="M6 2v6" />
    <Path d="M10 2v6" />
    <Path d="M14 2v6" />
  </Svg>
));

const ShoppingIcon = React.memo(({ size = 18, color = '#B7884E' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <Line x1="3" y1="6" x2="21" y2="6" />
    <Path d="M16 10a4 4 0 0 1-8 0" />
  </Svg>
));

const TravelIcon = React.memo(({ size = 18, color = '#B7884E' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2" />
    <Circle cx="7" cy="17" r="2" />
    <Circle cx="17" cy="17" r="2" />
  </Svg>
));

const GenericCategoryIcon = React.memo(({ size = 18, color = '#B7884E' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 8H9v8h3" />
    <Path d="M9 12h3" />
  </Svg>
));

const CheckCircleIcon = React.memo(({ size = 16, color = '#3E5A2A' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <Polyline points="22 4 12 14.01 9 11.01" />
  </Svg>
));

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();

  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Dev Tweak: tempTransactions overrides database values when populated, cleared on Refresh
  const [tempTransactions, setTempTransactions] = useState<Transaction[] | null>(null);

  // Redesign Tooltips, FAQ, & habits modal states
  const [showFAQ, setShowFAQ] = useState(false);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [showHabitsModal, setShowHabitsModal] = useState(false);
  const [showHealthTooltip, setShowHealthTooltip] = useState(false);
  const [showRisksTooltip, setShowRisksTooltip] = useState(false);

  // Animated values for pressable cards & tooltips
  const patternScale = useRef(new Animated.Value(1)).current;
  const habitsScale = useRef(new Animated.Value(1)).current;
  const infoIconScale = useRef(new Animated.Value(1)).current;
  const healthTooltipAnim = useRef(new Animated.Value(0)).current;
  const risksInfoScale = useRef(new Animated.Value(1)).current;
  const risksTooltipAnim = useRef(new Animated.Value(0)).current;

  const handlePatternPressIn = () => {
    Animated.spring(patternScale, {
      toValue: 0.94,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  };

  const handlePatternPressOut = () => {
    Animated.spring(patternScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 120,
    }).start();
  };

  const handleHabitsPressIn = () => {
    Animated.spring(habitsScale, {
      toValue: 0.94,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  };

  const handleHabitsPressOut = () => {
    Animated.spring(habitsScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 120,
    }).start();
  };

  const handleInfoPressIn = () => {
    Animated.spring(infoIconScale, {
      toValue: 0.82,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  };

  const handleInfoPressOut = () => {
    Animated.spring(infoIconScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 120,
    }).start();
  };

  const handleRisksInfoPressIn = () => {
    Animated.spring(risksInfoScale, {
      toValue: 0.82,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  };

  const handleRisksInfoPressOut = () => {
    Animated.spring(risksInfoScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 120,
    }).start();
  };

  useEffect(() => {
    Animated.spring(healthTooltipAnim, {
      toValue: showHealthTooltip ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();
  }, [showHealthTooltip]);

  useEffect(() => {
    Animated.spring(risksTooltipAnim, {
      toValue: showRisksTooltip ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();
  }, [showRisksTooltip]);

  const transactions = useTransactionStore((s) => s.transactions);
  const categories = useTransactionStore((s) => s.categories);
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const loadCategories = useTransactionStore((s) => s.loadCategories);
  const getTotalBalance = useTransactionStore((s) => s.getTotalBalance);

  // Formulate active transactions list (prioritize dev-friendly temp dataset)
  const activeTransactions = useMemo(() => {
    return tempTransactions || transactions;
  }, [tempTransactions, transactions]);

  // Dynamic dev-friendly mock transactions generator
  const generateMockTransactions = (): Transaction[] => {
    const foodId = categories.find((c) => c.name.toLowerCase().includes('food') || c.name.toLowerCase().includes('dining'))?.id || 'mock-food';
    const shopId = categories.find((c) => c.name.toLowerCase().includes('shop') || c.name.toLowerCase().includes('cloth'))?.id || 'mock-shop';

    const now = new Date();
    const getPastDate = (daysAgo: number, hour: number) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, hour, 30);
      return d.toISOString();
    };

    return [
      // Income (Salary)
      {
        id: 'mock-inc-1',
        accountId: 'mock-acc',
        type: 'income',
        amount: 60000,
        categoryId: null,
        merchant: 'Salary Pay',
        description: 'Monthly salary credited',
        date: getPastDate(10, 10),
        source: 'manual',
        smsHash: null,
        isRecurring: true,
        tags: [],
        createdAt: now.toISOString(),
        syncedAt: null,
      },
      // Food Spends
      {
        id: 'mock-food-1',
        accountId: 'mock-acc',
        type: 'expense',
        amount: 1250,
        categoryId: foodId,
        merchant: 'Zomato',
        description: 'Dinner delivery',
        date: getPastDate(2, 20), // Evening
        source: 'manual',
        smsHash: null,
        isRecurring: false,
        tags: [],
        createdAt: now.toISOString(),
        syncedAt: null,
      },
      // Money Leaks (4 transactions at Starbucks under 300)
      {
        id: 'mock-leak-1',
        accountId: 'mock-acc',
        type: 'expense',
        amount: 280,
        categoryId: foodId,
        merchant: 'Starbucks',
        description: 'Coffee spend',
        date: getPastDate(1, 16),
        source: 'manual',
        smsHash: null,
        isRecurring: false,
        tags: [],
        createdAt: now.toISOString(),
        syncedAt: null,
      },
      {
        id: 'mock-leak-2',
        accountId: 'mock-acc',
        type: 'expense',
        amount: 280,
        categoryId: foodId,
        merchant: 'Starbucks',
        description: 'Coffee spend',
        date: getPastDate(3, 16),
        source: 'manual',
        smsHash: null,
        isRecurring: false,
        tags: [],
        createdAt: now.toISOString(),
        syncedAt: null,
      },
      {
        id: 'mock-leak-3',
        accountId: 'mock-acc',
        type: 'expense',
        amount: 280,
        categoryId: foodId,
        merchant: 'Starbucks',
        description: 'Coffee spend',
        date: getPastDate(5, 16),
        source: 'manual',
        smsHash: null,
        isRecurring: false,
        tags: [],
        createdAt: now.toISOString(),
        syncedAt: null,
      },
      {
        id: 'mock-leak-4',
        accountId: 'mock-acc',
        type: 'expense',
        amount: 280,
        categoryId: foodId,
        merchant: 'Starbucks',
        description: 'Coffee spend',
        date: getPastDate(7, 16),
        source: 'manual',
        smsHash: null,
        isRecurring: false,
        tags: [],
        createdAt: now.toISOString(),
        syncedAt: null,
      },
      // Weekend overspend spends
      {
        id: 'mock-weekend-1',
        accountId: 'mock-acc',
        type: 'expense',
        amount: 4500,
        categoryId: shopId,
        merchant: 'Zara',
        description: 'Weekend shopping spree',
        date: (() => {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          while (d.getDay() !== 6 && d.getDay() !== 0) {
            d.setDate(d.getDate() - 1);
          }
          d.setHours(19, 0);
          return d.toISOString();
        })(),
        source: 'manual',
        smsHash: null,
        isRecurring: false,
        tags: [],
        createdAt: now.toISOString(),
        syncedAt: null,
      },
      // Cash withdrawals on Friday
      {
        id: 'mock-cash-1',
        accountId: 'mock-acc',
        type: 'expense',
        amount: 2000,
        categoryId: null,
        merchant: 'HDFC ATM',
        description: 'Cash withdrawal ATM',
        date: (() => {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          while (d.getDay() !== 5) {
            d.setDate(d.getDate() - 1);
          }
          d.setHours(18, 0);
          return d.toISOString();
        })(),
        source: 'manual',
        smsHash: null,
        isRecurring: false,
        tags: [],
        createdAt: now.toISOString(),
        syncedAt: null,
      },
      // Spotify Subscription
      {
        id: 'mock-sub-1',
        accountId: 'mock-acc',
        type: 'expense',
        amount: 129,
        categoryId: null,
        merchant: 'Spotify',
        description: 'Spotify Premium subscription',
        date: getPastDate(5, 12),
        source: 'manual',
        smsHash: null,
        isRecurring: true,
        tags: [],
        createdAt: now.toISOString(),
        syncedAt: null,
      },
      // Zara Shopping in previous month to calculate percent change
      {
        id: 'mock-weekend-prev',
        accountId: 'mock-acc',
        type: 'expense',
        amount: 4000,
        categoryId: shopId,
        merchant: 'Zara',
        description: 'Previous month shopping',
        date: getPastDate(35, 15),
        source: 'manual',
        smsHash: null,
        isRecurring: false,
        tags: [],
        createdAt: now.toISOString(),
        syncedAt: null,
      },
    ];
  };

  const runSmsSimulation = async () => {
    setIsScanning(true);
    setScanStep(0);

    // Step-by-step progress simulation
    setTimeout(() => setScanStep(1), 800);
    setTimeout(() => setScanStep(2), 1600);
    setTimeout(async () => {
      setScanStep(3);
      try {
        // We load transactions and categories but do NOT write mock data to SQLite DB.
        // This ensures the simulated analysis data remains temporary and is cleared on refresh.
        await loadTransactions();
        await loadCategories();
      } catch (err) {
        console.error('Scan error:', err);
      }
    }, 2400);
    setTimeout(() => setScanStep(4), 3200);
    setTimeout(() => setScanStep(5), 4000);
    setTimeout(() => {
      setIsScanning(false);
      // Dev Tweak: load temporary mock data
      setTempTransactions(generateMockTransactions());
      Alert.alert('Analysis Complete', 'I populated observations and leak patterns on your board.');
    }, 4800);
  };

  // Pull-to-refresh handler: clears temporary mock transactions and reloads database
  const onRefresh = async () => {
    setRefreshing(true);
    setTempTransactions(null);
    await loadTransactions();
    await loadCategories();
    setRefreshing(false);
  };

  useEffect(() => {
    loadTransactions();
    loadCategories();
  }, []);

  const currentBalance = getTotalBalance();
  const survivalScore = calculateSalarySurvivalScore(activeTransactions);

  const detectedInsights = useMemo(() => {
    return generateAllInsights(activeTransactions, categories, currentBalance);
  }, [activeTransactions, categories, currentBalance]);

  // Survival score status and explanation
  const scoreStatus = useMemo(() => {
    if (survivalScore >= 90) return { label: 'Excellent', text: 'Your spending looks stable and I detected no unusual activity this week.' };
    if (survivalScore >= 70) return { label: 'Healthy', text: 'Your financial cushion looks healthy, keep supporting your key saving goals.' };
    if (survivalScore >= 50) return { label: 'Watch Closely', text: 'Discretionary spending is rising, check your recent transaction spikes.' };
    return { label: 'Needs Attention', text: 'High expenditure rate detected. Consider slowing down non-essential spend immediately.' };
  }, [survivalScore]);

  // Section 2: What We Found mini cards mapping
  const foundInsights = useMemo(() => {
    const leakInsight = detectedInsights.find((i) => i.type === 'money_leak');
    const overspendInsight = detectedInsights.find(
      (i) => i.type === 'weekend_overspend' || i.type === 'impulse_spending' || i.type === 'shopping_increase'
    );

    return {
      leaks: leakInsight
        ? { title: 'Possible Money Leak', desc: leakInsight.subtitle }
        : { title: 'No Money Leaks', desc: 'No recurring charges were detected.' },
      spends: overspendInsight
        ? { title: 'Unusual Spending', desc: overspendInsight.subtitle }
        : { title: 'No Unusual Spending', desc: 'Your spending pattern looks normal.' },
    };
  }, [detectedInsights]);

  // Section 3: Spending Pattern calculation
  const spendingPatterns = useMemo(() => {
    const expenses = activeTransactions.filter((t) => t.type === 'expense');
    if (expenses.length === 0) return [];

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthExpenses = expenses.filter((t) => new Date(t.date) >= startOfThisMonth);
    
    const thisMonthGrouped: Record<string, number> = {};
    thisMonthExpenses.forEach((t) => {
      const catName = t.categoryId ? (categories.find((c) => c.id === t.categoryId)?.name || 'Other') : 'Other';
      thisMonthGrouped[catName] = (thisMonthGrouped[catName] || 0) + t.amount;
    });

    const sortedCategories = Object.entries(thisMonthGrouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    // Ensure we have at least 2 categories to show
    let categoriesToShow = [...sortedCategories];
    if (categoriesToShow.length < 2) {
      const usedCategories = new Set(categoriesToShow.map(([cat]) => cat));
      const availableCategories = categories.map((c) => c.name);
      for (const cat of availableCategories) {
        if (!usedCategories.has(cat)) {
          categoriesToShow.push([cat, 0]);
          if (categoriesToShow.length >= 2) break;
        }
      }
    }
    while (categoriesToShow.length < 2) {
      if (categoriesToShow.length === 0) {
        categoriesToShow.push(['Food & Dining', 0]);
      } else {
        const firstCat = categoriesToShow[0][0];
        categoriesToShow.push([firstCat === 'Food & Dining' ? 'Shopping' : 'Food & Dining', 0]);
      }
    }

    return categoriesToShow.map(([category, amount]) => {
      // Find all expenses in this category for this month
      const thisMonthCatExpenses = expenses.filter((t) => {
        const d = new Date(t.date);
        const catName = t.categoryId ? (categories.find((c) => c.id === t.categoryId)?.name || 'Other') : 'Other';
        return catName === category && d >= startOfThisMonth;
      });

      // Find top 2 merchants/areas for this category this month
      const merchantGrouped: Record<string, number> = {};
      thisMonthCatExpenses.forEach((t) => {
        const merchantName = t.merchant || t.description || 'General Spends';
        merchantGrouped[merchantName] = (merchantGrouped[merchantName] || 0) + t.amount;
      });

      const topMerchants = Object.entries(merchantGrouped)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([m]) => m);

      // Ensure at least 2 areas if amount is positive
      if (amount > 0) {
        while (topMerchants.length < 2) {
          if (topMerchants.length === 0) {
            topMerchants.push('General Spends', 'Other Outlets');
          } else {
            topMerchants.push('Other Outlets');
          }
        }
      } else {
        topMerchants.push('No transactions detected', 'Stable baseline');
      }

      const lastMonthCatExpenses = expenses.filter((t) => {
        const d = new Date(t.date);
        const catName = t.categoryId ? (categories.find((c) => c.id === t.categoryId)?.name || 'Other') : 'Other';
        return catName === category && d >= startOfLastMonth && d <= endOfLastMonth;
      });

      const lastMonthAmount = lastMonthCatExpenses.reduce((sum, t) => sum + t.amount, 0);
      const amountChange = Math.round(amount - lastMonthAmount);

      let percentChange = 0;
      let direction: 'up' | 'down' | 'neutral' = 'neutral';

      if (lastMonthAmount > 0) {
        const change = ((amount - lastMonthAmount) / lastMonthAmount) * 100;
        percentChange = Math.round(Math.abs(change));
        direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      } else if (amount > 0) {
        direction = 'up';
        percentChange = 100;
      } else {
        direction = 'neutral';
        percentChange = 0;
      }

      let positiveInsight = '';
      if (direction === 'down' || (amount === 0 && lastMonthAmount > 0)) {
        const savedVal = amount === 0 ? lastMonthAmount : Math.abs(amountChange);
        positiveInsight = `Excellent discipline! You saved ₹${savedVal.toLocaleString('en-IN')} this month by trimming your spends here. Keep this up to grow your safety cushion!`;
        direction = 'down';
        percentChange = 100;
      }

      return {
        category,
        amount: Math.round(amount),
        percentChange,
        direction,
        amountChange,
        topMerchants,
        positiveInsight,
      };
    });
  }, [activeTransactions, categories]);

  const activeCategoryInfo = useMemo(() => {
    return spendingPatterns[0] || null;
  }, [spendingPatterns]);

  // Section 4: Money Habits calculation
  const habits = useMemo(() => {
    const list: string[] = [];
    const expenses = activeTransactions.filter((t) => t.type === 'expense');
    if (expenses.length === 0) return list;

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthExpenses = expenses.filter((t) => new Date(t.date) >= startOfThisMonth);

    if (currentMonthExpenses.length === 0) return list;

    const totalExpense = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

    // 1. Weekend spend ratio
    let weekendSpend = 0;
    currentMonthExpenses.forEach((t) => {
      const d = new Date(t.date);
      const day = d.getDay();
      if (day === 0 || day === 6) {
        weekendSpend += t.amount;
      }
    });
    const weekendPct = totalExpense > 0 ? (weekendSpend / totalExpense) * 100 : 0;
    if (weekendPct > 35) {
      list.push(`Most spending occurs on weekends`);
    } else {
      list.push('Weekday spending patterns remain steady and balanced');
    }

    // 2. Food category percentage
    let foodSpend = 0;
    currentMonthExpenses.forEach((t) => {
      const catName = t.categoryId ? (categories.find((c) => c.id === t.categoryId)?.name || '') : '';
      const cat = catName.toLowerCase();
      if (cat.includes('food') || cat.includes('dining') || cat.includes('eat') || cat.includes('restaurant')) {
        foodSpend += t.amount;
      }
    });
    const foodPct = totalExpense > 0 ? (foodSpend / totalExpense) * 100 : 0;
    if (foodPct > 0) {
      list.push(`Food accounts for ${Math.round(foodPct)}% of expenses`);
    }

    // 3. Evening transactions ratio
    let eveningCount = 0;
    currentMonthExpenses.forEach((t) => {
      const hour = new Date(t.date).getHours();
      if (hour >= 17 && hour < 23) {
        eveningCount++;
      }
    });
    const eveningPct = currentMonthExpenses.length > 0 ? (eveningCount / currentMonthExpenses.length) * 100 : 0;
    if (eveningPct > 40) {
      list.push(`Transactions increase during evenings`);
    } else {
      list.push(`Transactions are evenly distributed throughout the day`);
    }

    // 4. Cash usage
    const cashTxs = currentMonthExpenses.filter(
      (t) => (t.description || '').toLowerCase().includes('cash') || (t.merchant || '').toLowerCase().includes('atm')
    );
    if (cashTxs.length > 0) {
      const daysCount: Record<number, number> = {};
      cashTxs.forEach((t) => {
        const day = new Date(t.date).getDay();
        daysCount[day] = (daysCount[day] || 0) + 1;
      });
      let maxDay = -1;
      let maxCount = 0;
      Object.entries(daysCount).forEach(([dayStr, count]) => {
        const d = parseInt(dayStr);
        if (count > maxCount) {
          maxCount = count;
          maxDay = d;
        }
      });
      const daysOfWeek = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
      if (maxDay >= 0) {
        list.push(`Cash withdrawals occur mostly on ${daysOfWeek[maxDay]}`);
      }
    }

    return list.slice(0, 3); // return up to 3 habits
  }, [activeTransactions, categories]);

  // Section 5: Spending Risks calculation
  const risks = useMemo(() => {
    let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
    const list: string[] = [];

    if (detectedInsights.length === 0) {
      return {
        level: riskLevel,
        checklist: [
          'I detected no abnormal spending',
          'I found no suspicious spikes',
          'I detected no spending anomalies',
        ],
      };
    }

    const impulseCount = detectedInsights.filter((i) => i.type === 'impulse_spending').length;
    const weekendCount = detectedInsights.filter((i) => i.type === 'weekend_overspend').length;
    const leakCount = detectedInsights.filter((i) => i.type === 'money_leak').length;

    const totalAnomalies = impulseCount + weekendCount + leakCount;
    if (totalAnomalies >= 3) {
      riskLevel = 'High';
    } else if (totalAnomalies > 0) {
      riskLevel = 'Medium';
    }

    detectedInsights.forEach((insight) => {
      if (insight.type === 'impulse_spending') {
        list.push('Large transaction or impulse detected');
      } else if (insight.type === 'weekend_overspend') {
        list.push('Weekend spending is increasing');
      } else if (insight.type === 'money_leak' && activeCategoryInfo) {
        list.push(`${activeCategoryInfo.category} expenses are above normal`);
      }
    });

    // Make sure we have 3 checklist items
    while (list.length < 3) {
      if (list.length === 0) {
        list.push('I detected no abnormal spending');
      } else if (list.length === 1) {
        list.push('I found no suspicious spikes');
      } else {
        list.push('I detected no spending anomalies');
      }
    }

    return {
      level: riskLevel,
      checklist: list.slice(0, 3),
    };
  }, [detectedInsights, activeCategoryInfo]);

  // Section 7: Smart Observations calculation
  const observations = useMemo(() => {
    const list: string[] = [];
    const expenses = activeTransactions.filter((t) => t.type === 'expense');

    if (expenses.length === 0) {
      return [
        'You spend ₹0 less on weekdays',
        'Cash usage is steady compared to last month',
        'Average transaction value is ₹0',
      ];
    }

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthExpenses = expenses.filter((t) => new Date(t.date) >= startOfThisMonth);
    const thisMonthTotal = thisMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

    // 1. Weekday spend vs Weekend spend average difference
    let weekdaySum = 0;
    let weekdayDays = new Set<string>();
    let weekendSum = 0;
    let weekendDays = new Set<string>();

    thisMonthExpenses.forEach((t) => {
      const d = new Date(t.date);
      const day = d.getDay();
      const dateStr = d.toISOString().split('T')[0];

      if (day === 0 || day === 6) {
        weekendSum += t.amount;
        weekendDays.add(dateStr);
      } else {
        weekdaySum += t.amount;
        weekdayDays.add(dateStr);
      }
    });

    const avgWeekday = weekdayDays.size > 0 ? weekdaySum / weekdayDays.size : 0;
    const avgWeekend = weekendDays.size > 0 ? weekendSum / weekendDays.size : 0;

    if (avgWeekend > avgWeekday) {
      list.push(`You spend ₹${Math.round(avgWeekend - avgWeekday)} less on weekdays`);
    } else {
      list.push(`You spend ₹${Math.round(avgWeekday - avgWeekend)} less on weekends`);
    }

    // 2. Cash ratio change
    const thisMonthCash = thisMonthExpenses
      .filter((t) => (t.description || '').toLowerCase().includes('cash') || (t.merchant || '').toLowerCase().includes('atm'))
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthExpenses = expenses.filter((t) => {
      const d = new Date(t.date);
      return d >= startOfLastMonth && d <= endOfLastMonth;
    });

    const lastMonthTotal = lastMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const lastMonthCash = lastMonthExpenses
      .filter((t) => (t.description || '').toLowerCase().includes('cash') || (t.merchant || '').toLowerCase().includes('atm'))
      .reduce((sum, t) => sum + t.amount, 0);

    const thisMonthCashRatio = thisMonthTotal > 0 ? thisMonthCash / thisMonthTotal : 0;
    const lastMonthCashRatio = lastMonthTotal > 0 ? lastMonthCash / lastMonthTotal : 0;

    if (lastMonthCashRatio > thisMonthCashRatio) {
      const reduction = Math.round((lastMonthCashRatio - thisMonthCashRatio) * 100);
      list.push(`Cash usage is ${reduction}% lower than last month`);
    } else if (thisMonthCashRatio > lastMonthCashRatio) {
      const increase = Math.round((thisMonthCashRatio - lastMonthCashRatio) * 100);
      list.push(`Cash usage is ${increase}% higher than last month`);
    } else {
      list.push('Cash usage is steady compared to last month');
    }

    // 3. Average transaction value
    const avgValue = thisMonthExpenses.length > 0 ? thisMonthTotal / thisMonthExpenses.length : 0;
    list.push(`Average transaction value is ₹${Math.round(avgValue)}`);

    return list;
  }, [activeTransactions]);

  // Section 8: Growth Tips calculation (Personalized/Data-driven, No random facts)
  const personalizedTip = useMemo(() => {
    if (activeTransactions.length === 0) {
      return 'Saving ₹50 daily becomes ₹18,250 yearly. Keep logging transactions to get my custom coach advice!';
    }

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthExpenses = activeTransactions.filter((t) => t.type === 'expense' && new Date(t.date) >= startOfThisMonth);

    if (currentMonthExpenses.length === 0) {
      return 'Saving ₹50 daily becomes ₹18,250 yearly. Keep logging transactions to get my custom coach advice!';
    }

    // 1. If a leak exists, show savings details
    const leak = detectedInsights.find((i) => i.type === 'money_leak');
    if (leak && leak.impactAmount) {
      const merchant = leak.subtitle.replace('Frequent small spends at ', '') || 'micro-spends';
      const annualSavings = Math.round(leak.impactAmount * 12 * 0.5);
      return `Cutting your spends at ${merchant} by 50% would add ₹${annualSavings.toLocaleString('en-IN')} back to your annual savings.`;
    }

    // 2. If weekend spend is significantly higher
    let weekdaySum = 0;
    let weekdayDays = new Set<string>();
    let weekendSum = 0;
    let weekendDays = new Set<string>();

    currentMonthExpenses.forEach((t) => {
      const d = new Date(t.date);
      const day = d.getDay();
      const dateStr = d.toISOString().split('T')[0];
      if (day === 0 || day === 6) {
        weekendSum += t.amount;
        weekendDays.add(dateStr);
      } else {
        weekdaySum += t.amount;
        weekdayDays.add(dateStr);
      }
    });

    const avgWeekday = weekdayDays.size > 0 ? weekdaySum / weekdayDays.size : 0;
    const avgWeekend = weekendDays.size > 0 ? weekendSum / weekendDays.size : 0;

    if (avgWeekend > avgWeekday * 1.3 && weekendDays.size > 0) {
      const monthlySavings = Math.round((avgWeekend - avgWeekday) * weekendDays.size);
      return `Aligning your weekend average with weekdays would save you ₹${monthlySavings.toLocaleString('en-IN')} this month.`;
    }

    // 3. Category tip
    if (activeCategoryInfo) {
      const savings10 = Math.round(activeCategoryInfo.amount * 0.1);
      return `Saving just 10% on ${activeCategoryInfo.category} this month translates to ₹${savings10.toLocaleString('en-IN')} extra saved.`;
    }

    return 'Saving ₹50 daily becomes ₹18,250 yearly. Keep logging transactions to get my custom coach advice!';
  }, [activeTransactions, detectedInsights, activeCategoryInfo]);

  // Dynamic icon renderer helper for spending categories
  const renderCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('food') || cat.includes('dining') || cat.includes('eat') || cat.includes('restaurant')) {
      return <FoodIcon size={18} color="#B7884E" />;
    }
    if (cat.includes('shop') || cat.includes('cloth') || cat.includes('buy') || cat.includes('store')) {
      return <ShoppingIcon size={18} color="#B7884E" />;
    }
    if (cat.includes('travel') || cat.includes('cab') || cat.includes('auto') || cat.includes('ride') || cat.includes('fuel')) {
      return <TravelIcon size={18} color="#B7884E" />;
    }
    return <GenericCategoryIcon size={18} color="#B7884E" />;
  };

  // Helper for Circular Score indicator
  const radius = 34;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius; // ~213.6
  const strokeDashoffset = circumference * (1 - survivalScore / 100);

  return (
    <>
      <StatusBar style="dark" />
      <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + 16 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#745143"
          colors={['#3E5A2A']}
        />
      }
    >
      {/* Reusable Header */}
      <TabHeader
        variant="tactile"
        microHeader="FINANCIAL INTELLIGENCE"
        title="Your Money Story"
        titleSuffix={
          <Pressable
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowFAQ(true);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.infoQuestionBtn}
          >
            <Text style={styles.infoQuestionText}>[?]</Text>
          </Pressable>
        }
        subtitle={
          <Text style={styles.headerSubtitle}>
            Here's what SpendLens learned from your activity.
          </Text>
        }
        renderRight={() => (
          <Pressable
            onPress={() => {
              if (!isScanning) {
                runSmsSimulation();
              }
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <ReadingNotebookMascot width={95} height={76} />
          </Pressable>
        )}
      />

      {isScanning ? (
        <View style={styles.scannerContainer}>
          <Text style={styles.scannerHeader}>SCANNING DEVICE TELEMETRY...</Text>
          <View style={styles.scannerConsole}>
            {SCAN_STEPS.slice(0, scanStep + 1).map((step, idx) => (
              <Text
                key={idx}
                style={[
                  styles.consoleLine,
                  {
                    color: idx === scanStep ? '#3E5A2A' : '#54554B',
                    fontFamily: typography.fontFamily.mono,
                  },
                ]}
              >
                {idx < scanStep ? '✓ ' : '▶ '}
                {step.message}
              </Text>
            ))}
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${SCAN_STEPS[scanStep].progress * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressPct}>
            STATUS: {Math.round(SCAN_STEPS[scanStep].progress * 100)}% COMPLETE
          </Text>
        </View>
      ) : activeTransactions.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyCard}>
          <Pressable
            onPress={() => {
              if (!isScanning) {
                runSmsSimulation();
              }
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <ReadingNotebookMascot width={150} height={130} />
          </Pressable>
          <Text style={styles.emptyTitle}>SpendLens is Learning</Text>
          <Text style={styles.emptySubtitle}>
            Your money story will appear here as activity arrives. Tap the notebook mascot to simulate transactions!
          </Text>
        </View>
      ) : (
        /* Insights Dashboard */
        <>
          {/* SECTION 1: Financial Health Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.scoreRow}>
              <View style={{ width: 102, height: 102, justifyContent: 'center', alignItems: 'center' }}>
                <Svg width="102" height="102" viewBox="0 0 100 100">
                  <Circle cx="50" cy="50" r={radius} stroke="#EEF4E6" strokeWidth={strokeWidth} fill="none" />
                  <Circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#3E5A2A"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    transform="rotate(-90 50 50)"
                  />
                </Svg>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 25, fontFamily: typography.fontFamily.bold, color: '#745143', textAlign: 'center', lineHeight: 27 }}>
                    {survivalScore}
                  </Text>
                  <View style={{ height: 1, width: 26, backgroundColor: '#745143', marginVertical: 2 }} />
                  <Text style={{ fontSize: 12, fontFamily: typography.fontFamily.bold, color: '#54554B', textAlign: 'center', lineHeight: 13 }}>
                    100
                  </Text>
                </View>
              </View>

              <View style={styles.healthInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.statusBadge}>
                    <CheckCircleIcon size={12} color="#3E5A2A" />
                    <Text style={styles.statusText}>{scoreStatus.label}</Text>
                  </View>
                  <Pressable
                    onPressIn={handleInfoPressIn}
                    onPressOut={handleInfoPressOut}
                    onPress={() => {
                      setShowHealthTooltip(!showHealthTooltip);
                    }}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    style={styles.infoQuestionBtn}
                  >
                    <Animated.View style={{ transform: [{ scale: infoIconScale }] }}>
                      <InfoIcon size={18} color="#B7884E" />
                    </Animated.View>
                  </Pressable>
                </View>
                <Text style={styles.descriptionText}>{scoreStatus.text}</Text>
              </View>
            </View>

            <View style={styles.plantDecor}>
              <CornerPlant width={60} height={50} />
            </View>
          </View>

          {/* Section 1 Tooltip */}
          <Animated.View
            style={[
              styles.tooltipCard,
              {
                opacity: healthTooltipAnim,
                transform: [
                  {
                    scale: healthTooltipAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.92, 1],
                    }),
                  },
                ],
                display: showHealthTooltip ? 'flex' : 'none',
              },
            ]}
          >
            <Text style={styles.tooltipTextBold}>Cushion Score (0-100):</Text>
            <Text style={styles.tooltipText}>
              I calculate this based on your monthly savings rate (income vs. expenses). 80-100 is Excellent (saving 30%+), 50-79 is Healthy (saving 10-29%), and below 50 means your cushion needs attention.
            </Text>
            <Pressable
              onPress={() => {
                setShowHealthTooltip(false);
              }}
              style={styles.tooltipCloseBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.tooltipCloseText}>Close</Text>
            </Pressable>
          </Animated.View>

          {/* SECTION 2: What We Found overview row */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>What We Found</Text>
          </View>
          <View style={styles.cardRow}>
            <View style={styles.miniCard}>
              <View style={styles.iconBox}>
                <ShieldIcon size={18} color="#3E5A2A" />
              </View>
              <View style={styles.miniCardContent}>
                <Text style={styles.miniCardTitle} numberOfLines={1}>
                  {foundInsights.leaks.title}
                </Text>
                <Text style={styles.miniCardDesc} numberOfLines={2}>
                  {foundInsights.leaks.desc}
                </Text>
              </View>
            </View>

            <View style={styles.miniCard}>
              <View style={styles.iconBox}>
                <GraphUpIcon size={18} color="#3E5A2A" />
              </View>
              <View style={styles.miniCardContent}>
                <Text style={styles.miniCardTitle} numberOfLines={1}>
                  {foundInsights.spends.title}
                </Text>
                <Text style={styles.miniCardDesc} numberOfLines={2}>
                  {foundInsights.spends.desc}
                </Text>
              </View>
            </View>
          </View>

          {/* SECTIONS 3 & 4: Spending Pattern & Money Habits (Split Card Row) */}
          <View style={styles.splitRow}>
            {/* SECTION 3: Spending Pattern */}
            <Pressable
              onPressIn={handlePatternPressIn}
              onPressOut={handlePatternPressOut}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowPatternModal(true);
              }}
              style={{ flex: 1 }}
            >
              <Animated.View style={[styles.splitCard, { transform: [{ scale: patternScale }] }]}>
                <Text style={styles.sectionTitle}>Spending Pattern</Text>
                {spendingPatterns.length > 0 ? (
                  <View style={{ flex: 1, justifyContent: 'flex-start', gap: 12, marginTop: 12 }}>
                    {spendingPatterns.slice(0, 2).map((pattern) => {
                      const isUp = pattern.direction === 'up';
                      const isDown = pattern.direction === 'down';
                      const statusColor = isUp ? '#B7884E' : isDown ? '#3E5A2A' : '#54554B';
                      
                      return (
                        <View key={pattern.category} style={{ gap: 2 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {renderCategoryIcon(pattern.category)}
                            <Text style={{ fontSize: 15, fontFamily: typography.fontFamily.bold, color: '#745143', flex: 1 }} numberOfLines={1}>
                              {pattern.category}
                            </Text>
                            <Text style={{ fontSize: 14, fontFamily: typography.fontFamily.bold, color: statusColor }}>
                              {isUp ? `+₹${Math.abs(pattern.amountChange).toLocaleString('en-IN')}` : isDown ? 'Saved' : 'Stable'}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 12, fontFamily: typography.fontFamily.medium, color: '#54554B', marginLeft: 24 }} numberOfLines={1}>
                            {isUp 
                              ? `Spent ${pattern.percentChange}% more` 
                              : isDown 
                              ? `Reduced by ${pattern.percentChange}%` 
                              : 'Consistent spends'}
                          </Text>
                        </View>
                      );
                    })}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 'auto', gap: 4, zIndex: 1 }}>
                      <Text style={{ fontSize: 11, fontFamily: typography.fontFamily.bold, color: '#B7884E' }}>
                        Tap to view details
                      </Text>
                      <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B7884E" strokeWidth={2.5}>
                        <Path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.descriptionText, { marginTop: 24 }]}>Not enough activity yet</Text>
                )}
                <View style={styles.splitCardDecor} pointerEvents="none">
                  <CornerPlant width={45} height={35} />
                </View>
              </Animated.View>
            </Pressable>

            {/* SECTION 4: Money Habits */}
            <Pressable
              onPressIn={handleHabitsPressIn}
              onPressOut={handleHabitsPressOut}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowHabitsModal(true);
              }}
              style={{ flex: 1 }}
            >
              <Animated.View style={[styles.splitCard, { transform: [{ scale: habitsScale }] }]}>
                <Text style={styles.sectionTitle}>Money Habits</Text>
                {habits.length > 0 ? (
                  <View style={[styles.habitList, { flex: 1 }]}>
                    {habits.map((habit, index) => (
                      <View key={index} style={styles.habitItem}>
                        <View style={styles.habitIconBox}>
                          {index === 0 ? (
                            <CalendarIcon size={12} color="#3E5A2A" />
                          ) : index === 1 ? (
                            <PercentIcon size={12} color="#3E5A2A" />
                          ) : (
                            <ClockIcon size={12} color="#3E5A2A" />
                          )}
                        </View>
                        <Text style={styles.habitText} numberOfLines={2}>
                          {habit}
                        </Text>
                      </View>
                    ))}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 'auto', gap: 4, zIndex: 1 }}>
                      <Text style={{ fontSize: 11, fontFamily: typography.fontFamily.bold, color: '#3E5A2A' }}>
                        Tap to analyze habits
                      </Text>
                      <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3E5A2A" strokeWidth={2.5}>
                        <Path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.descriptionText, { marginTop: 24 }]}>I need more logged logs to reveal habits.</Text>
                )}
                <View style={styles.splitCardDecor} pointerEvents="none">
                  <CornerPlant width={45} height={35} />
                </View>
              </Animated.View>
            </Pressable>
          </View>

          {/* SECTION 5: Spending Risks */}
          <View style={[styles.sectionHeader, { justifyContent: 'flex-start', alignItems: 'center', gap: 6 }]}>
            <Text style={styles.sectionTitle}>Spending Risks</Text>
            <Pressable
              onPressIn={handleRisksInfoPressIn}
              onPressOut={handleRisksInfoPressOut}
              onPress={() => {
                setShowRisksTooltip(!showRisksTooltip);
              }}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              style={styles.infoQuestionBtn}
            >
              <Animated.View style={{ transform: [{ scale: risksInfoScale }] }}>
                <InfoIcon size={18} color="#B7884E" />
              </Animated.View>
            </Pressable>
          </View>

          {/* Section 5 Tooltip */}
          <Animated.View
            style={[
              styles.tooltipCard,
              {
                opacity: risksTooltipAnim,
                transform: [
                  {
                    scale: risksTooltipAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.92, 1],
                    }),
                  },
                ],
                display: showRisksTooltip ? 'flex' : 'none',
              },
            ]}
          >
            <Text style={styles.tooltipTextBold}>Risk Level Guide:</Text>
            <Text style={styles.tooltipText}>
              I categorize risk based on the volume and severity of detected spending anomalies (like sudden weekend overspends or recurring leak patterns). Low = 0 anomalies, Medium = 1-2 warnings, High = 3+ warnings.
            </Text>
            <Pressable
              onPress={() => {
                setShowRisksTooltip(false);
              }}
              style={styles.tooltipCloseBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.tooltipCloseText}>Close</Text>
            </Pressable>
          </Animated.View>

          <View style={styles.risksCard}>
            <View style={styles.risksLeft}>
              <View style={styles.risksLevelHeader}>
                <ShieldIcon size={20} color="#3E5A2A" />
                <View>
                  <Text style={styles.risksLabel}>Risk Level</Text>
                  <Text style={[styles.risksLevel, { color: risks.level === 'High' ? '#C84B31' : risks.level === 'Medium' ? '#B7884E' : '#3E5A2A' }]}>
                    {risks.level}
                  </Text>
                </View>
              </View>
              <Text style={styles.risksDesc}>
                {risks.level === 'Low'
                  ? 'Your recent activity appears consistent with your normal behavior.'
                  : 'I detected some spending patterns that exceed your typical averages.'}
              </Text>
            </View>

            <View style={styles.risksRight}>
              {risks.checklist.map((item, index) => (
                <View key={index} style={styles.riskCheckItem}>
                  <CheckCircleIcon size={12} color={risks.level === 'Low' ? '#3E5A2A' : '#B7884E'} />
                  <Text style={styles.riskCheckText} numberOfLines={2}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* SECTION 6: Financial Safety Status */}
          <View style={styles.safetyCard}>
            <View style={styles.safetyHeaderRow}>
              <Text style={styles.sectionTitle}>Financial Safety</Text>
              <View style={styles.safetyProtectedBadge}>
                <CheckCircleIcon size={12} color="#3E5A2A" />
                <Text style={styles.statusText}>Protected</Text>
              </View>
            </View>

            <View style={styles.safetyGrid}>
              <View style={styles.safetyCol}>
                <View style={styles.safetyCircle}>
                  <ChatIcon size={18} color="#3E5A2A" />
                </View>
                <Text style={styles.safetyLabel}>SMS Monitoring</Text>
                <Text style={styles.safetyActiveText}>Active</Text>
              </View>

              <View style={styles.safetyCol}>
                <View style={styles.safetyCircle}>
                  <TagIcon size={18} color="#3E5A2A" />
                </View>
                <Text style={styles.safetyLabel}>Transaction Classification</Text>
                <Text style={styles.safetyActiveText}>Active</Text>
              </View>

              <View style={styles.safetyCol}>
                <View style={styles.safetyCircle}>
                  <PulseIcon size={18} color="#3E5A2A" />
                </View>
                <Text style={styles.safetyLabel}>Anomaly Detection</Text>
                <Text style={styles.safetyActiveText}>Active</Text>
              </View>
            </View>
          </View>

          {/* SECTION 7: Smart Observation */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Smart Observation</Text>
          </View>
          <View style={styles.observationCard}>
            <View style={styles.observationList}>
              {observations.map((obs, index) => (
                <View key={index} style={styles.observationItem}>
                  <LeafIcon size={14} color="#3E5A2A" />
                  <Text style={styles.observationText} numberOfLines={2}>
                    {obs}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.observationMascot}>
              <ReadingNotebookMascot width={90} height={72} />
            </View>
          </View>

          {/* SECTION 8: Growth Tip */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Growth Tip</Text>
          </View>
          <View style={styles.tipCard}>
            <View style={styles.tipLeft}>
              <BulbIcon size={20} color="#3E5A2A" />
            </View>
            <View style={styles.tipMiddle}>
              <Text style={styles.tipTitle}>Coach Tip</Text>
              <Text style={styles.tipDesc}>{personalizedTip}</Text>
            </View>
            <View style={styles.tipPlantDecor}>
              <CornerPlant width={50} height={40} />
            </View>
          </View>
        </>
      )}
    </ScrollView>

    {/* FAQ Guide Modal */}
    <Modal visible={showFAQ} transparent animationType="fade" onRequestClose={() => setShowFAQ(false)} statusBarTranslucent={true} navigationBarTranslucent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.faqCard, { maxHeight: '85%' }]}>
          <Text style={styles.faqTitle}>How I Analyze Your Money</Text>
          <Text style={styles.faqSubtitle}>I look at your activity across three timelines to help you make smarter choices next.</Text>

          <ScrollView style={{ width: '100%', marginVertical: 12 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 16 }}>
              <View style={styles.faqItem}>
                <Text style={styles.faqItemHeader}>Daily (Impulse Spends)</Text>
                <Text style={styles.faqItemBody}>I monitor rapid purchases at the same merchant to flag emotional shopping spikes in the moment.</Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqItemHeader}>Weekly (Lifestyle Creep)</Text>
                <Text style={styles.faqItemBody}>I compare weekend spending against weekdays and track transaction times to spotlight habits that sneak into your weekly routine.</Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqItemHeader}>Monthly (Survival Cushion)</Text>
                <Text style={styles.faqItemBody}>I calculate category totals and evaluate income vs. expense ratios to measure your cash cushion for the month.</Text>
              </View>
            </View>
          </ScrollView>

          <Pressable onPress={() => setShowFAQ(false)} style={styles.faqCloseBtn}>
            <Text style={styles.faqCloseBtnText}>Got it, thanks!</Text>
          </Pressable>
        </View>
      </View>
    </Modal>

    {/* Spending Pattern Detail Modal */}
    <Modal visible={showPatternModal} transparent animationType="fade" onRequestClose={() => setShowPatternModal(false)} statusBarTranslucent={true} navigationBarTranslucent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.faqCard, { maxHeight: '85%' }]}>
          <Text style={styles.faqTitle}>Spending Patterns</Text>
          <Text style={styles.faqSubtitle}>
            I track spikes and month-over-month changes in your highest spending categories.
          </Text>

          <ScrollView style={{ width: '100%', marginVertical: 12 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 12 }}>
              {spendingPatterns.map((pattern, index) => {
                const isUp = pattern.direction === 'up';
                const isDown = pattern.direction === 'down';
                const cardBg = isUp ? '#FFF0EE' : isDown ? '#EEF4E6' : '#FAF9F7';
                const borderColor = isUp ? '#EAA196' : isDown ? '#A6C88A' : '#E8DDD0';
                const textColor = isUp ? '#C84B31' : isDown ? '#3E5A2A' : '#54554B';
                
                return (
                  <View key={pattern.category} style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: borderColor, gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {renderCategoryIcon(pattern.category)}
                      <Text style={{ fontSize: 17, fontFamily: typography.fontFamily.bold, color: '#745143' }}>
                        {index === 0 ? 'Most Active: ' : 'Second Active: '}{pattern.category}
                      </Text>
                      <View style={{
                        backgroundColor: isUp ? '#FCE3E0' : isDown ? '#E1ECC8' : '#EEF4E6',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 99,
                        marginLeft: 'auto'
                      }}>
                        <Text style={{ fontSize: 12, fontFamily: typography.fontFamily.bold, color: textColor }}>
                          {isUp ? 'Increased' : isDown ? 'Saved Spends' : 'Stable'}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 15, fontFamily: typography.fontFamily.medium, color: '#54554B', marginTop: 2 }}>
                      Total spend: <Text style={{ fontFamily: typography.fontFamily.bold, color: '#745143' }}>₹{pattern.amount.toLocaleString('en-IN')}</Text> this month.
                    </Text>

                    {isDown && pattern.positiveInsight ? (
                      <View style={{ marginTop: 4, gap: 2 }}>
                        <Text style={{ fontSize: 14, fontFamily: typography.fontFamily.bold, color: '#3E5A2A' }}>
                          Positive Insight:
                        </Text>
                        <Text style={{ fontSize: 14, fontFamily: typography.fontFamily.medium, color: '#54554B', lineHeight: 18 }}>
                          {pattern.positiveInsight}
                        </Text>
                      </View>
                    ) : isUp ? (
                      <View style={{ marginTop: 4, gap: 2 }}>
                        <Text style={{ fontSize: 14, fontFamily: typography.fontFamily.bold, color: '#C84B31' }}>
                          Spending Increase:
                        </Text>
                        <Text style={{ fontSize: 14, fontFamily: typography.fontFamily.medium, color: '#54554B', lineHeight: 18 }}>
                          Spent {pattern.percentChange}% more (+₹{Math.abs(pattern.amountChange).toLocaleString('en-IN')}) compared to last month.
                        </Text>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 14, fontFamily: typography.fontFamily.medium, color: '#54554B' }}>
                        Spending in this category remained stable compared to last month.
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <Pressable onPress={() => setShowPatternModal(false)} style={styles.faqCloseBtn}>
            <Text style={styles.faqCloseBtnText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>

    {/* Money Habits Detail Modal */}
    <Modal visible={showHabitsModal} transparent animationType="fade" onRequestClose={() => setShowHabitsModal(false)} statusBarTranslucent={true} navigationBarTranslucent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.faqCard, { maxHeight: '85%' }]}>
          <Text style={styles.faqTitle}>Money Habits</Text>
          <Text style={styles.faqSubtitle}>
            I analyze your spending behaviors and transaction patterns to spotlight your core money habits.
          </Text>

          <ScrollView style={{ width: '100%', marginVertical: 12 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 12 }}>
              {habits.map((habit, index) => {
                let habitTitle = 'Financial Behavior';
                let habitDetail = 'I track this baseline trend to watch for unexpected fluctuations in your daily transactional lifestyle.';
                let isPositive = false;
                
                const lowerHabit = habit.toLowerCase();
                if (lowerHabit.includes('weekend')) {
                  if (lowerHabit.includes('most spending') || lowerHabit.includes('occurs on weekend')) {
                    habitTitle = 'Weekend Concentration';
                    habitDetail = 'I detected a higher concentration of spends on weekends. Try setting a specific weekend allowance to avoid lifestyle creep.';
                  } else {
                    habitTitle = 'Balanced Timeline';
                    habitDetail = 'Your weekday and weekend spends are well-balanced. This consistency helps you stick to your monthly savings goals.';
                    isPositive = true;
                  }
                } else if (lowerHabit.includes('food')) {
                  habitTitle = 'Dining & Food Ratio';
                  habitDetail = `Food accounts for a significant portion of your recent outgoings. Meal planning or cooking at home can yield easy savings.`;
                } else if (lowerHabit.includes('evening')) {
                  if (lowerHabit.includes('increase during evening')) {
                    habitTitle = 'Evening Spend Peaks';
                    habitDetail = 'Your transactions tend to peak in the evening hours. Be mindful of fatigue-induced shopping or late-night impulse orders.';
                  } else {
                    habitTitle = 'Even Time-Distribution';
                    habitDetail = 'Your transactions are evenly distributed. No specific time-of-day concentration detected.';
                    isPositive = true;
                  }
                } else if (lowerHabit.includes('cash') || lowerHabit.includes('atm')) {
                  habitTitle = 'ATM & Cash Usage';
                  habitDetail = 'Cash withdrawals are clustered on specific days. Track where physical cash goes, as it often slips by unrecorded.';
                }

                const cardBg = isPositive ? '#EEF4E6' : '#FAF9F7';
                const borderColor = isPositive ? '#A6C88A' : '#E8DDD0';
                const textColor = isPositive ? '#3E5A2A' : '#54554B';
                
                return (
                  <View key={index} style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: borderColor, gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={styles.habitIconBox}>
                        {index === 0 ? (
                          <CalendarIcon size={12} color="#3E5A2A" />
                        ) : index === 1 ? (
                          <PercentIcon size={12} color="#3E5A2A" />
                        ) : (
                          <ClockIcon size={12} color="#3E5A2A" />
                        )}
                      </View>
                      <Text style={{ fontSize: 16, fontFamily: typography.fontFamily.bold, color: '#745143', flex: 1 }}>
                        {habitTitle}
                      </Text>
                      <View style={{
                        backgroundColor: isPositive ? '#E1ECC8' : '#EEF4E6',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 99,
                        marginLeft: 'auto'
                      }}>
                        <Text style={{ fontSize: 11, fontFamily: typography.fontFamily.bold, color: textColor }}>
                          {isPositive ? 'Healthy habit' : 'Observation'}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 14, fontFamily: typography.fontFamily.bold, color: '#54554B', marginTop: 2 }}>
                      "{habit}"
                    </Text>

                    <Text style={{ fontSize: 14, fontFamily: typography.fontFamily.medium, color: '#54554B', lineHeight: 18, marginTop: 2 }}>
                      {habitDetail}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <Pressable onPress={() => setShowHabitsModal(false)} style={styles.faqCloseBtn}>
            <Text style={styles.faqCloseBtnText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </>
);
}

// Inline style hack object for typing issues on React Native Svg styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E1D7C2',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  headerSubtitle: {
    color: '#54554B',
    fontSize: 16,
    lineHeight: 21,
    fontFamily: typography.fontFamily.medium,
  },
  infoQuestionBtn: {
    marginLeft: 6,
    alignSelf: 'center',
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoQuestionText: {
    color: '#B7884E',
    fontSize: 21,
    fontFamily: typography.fontFamily.bold,
  },

  // Section 1: Financial Health
  heroCard: {
    backgroundColor: '#FFF8EE',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8DDD0',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#745143',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  healthInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4E6',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    gap: 4,
  },
  statusText: {
    color: '#3E5A2A',
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  descriptionText: {
    color: '#745143',
    fontSize: 15,
    lineHeight: 19,
    fontFamily: typography.fontFamily.medium,
  },
  plantDecor: {
    position: 'absolute',
    right: 4,
    bottom: 4,
  },

  // Tooltip & Modal
  tooltipCard: {
    backgroundColor: '#FFF8EE',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B7884E',
    padding: 14,
    marginBottom: 16,
    gap: 4,
  },
  tooltipTextBold: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: '#745143',
  },
  tooltipText: {
    fontSize: 15,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: '#54554B',
  },
  tooltipCloseBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tooltipCloseText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: '#B7884E',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 10, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  faqCard: {
    backgroundColor: '#FFF8EE',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8DDD0',
    padding: 26,
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  faqTitle: {
    fontSize: 23,
    fontFamily: typography.fontFamily.bold,
    color: '#745143',
    textAlign: 'center',
  },
  faqSubtitle: {
    fontSize: 15,
    lineHeight: 19,
    fontFamily: typography.fontFamily.medium,
    color: '#54554B',
    textAlign: 'center',
    marginBottom: 8,
  },
  faqItem: {
    gap: 4,
  },
  faqItemHeader: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: '#3E5A2A',
  },
  faqItemBody: {
    fontSize: 15,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: '#54554B',
  },
  faqCloseBtn: {
    backgroundColor: '#3E5A2A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  faqCloseBtnText: {
    color: '#FFF8EE',
    fontFamily: typography.fontFamily.bold,
    fontSize: 17,
  },

  // Section 2: What We Found
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
    color: '#745143',
    letterSpacing: 0.5,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  miniCard: {
    flex: 1,
    backgroundColor: '#FFF8EE',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8DDD0',
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    shadowColor: '#745143',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF4E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniCardContent: {
    flex: 1,
    gap: 2,
  },
  miniCardTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: '#745143',
  },
  miniCardDesc: {
    fontSize: 14,
    lineHeight: 17,
    fontFamily: typography.fontFamily.medium,
    color: '#54554B',
  },

  // Sections 3 & 4: Spending Pattern & Habits
  splitRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  splitCard: {
    flex: 1,
    backgroundColor: '#FFF8EE',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8DDD0',
    padding: 20,
    paddingBottom: 18,
    minHeight: 190,
    position: 'relative',
    shadowColor: '#745143',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  splitCardDecor: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    opacity: 0.45,
  },
  patternCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  patternCatLabel: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: '#54554B',
  },
  patternCatName: {
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
    color: '#745143',
  },
  patternAmount: {
    fontSize: 19,
    fontFamily: typography.fontFamily.bold,
    color: '#3E5A2A',
  },
  patternChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  patternChangeText: {
    color: '#B7884E',
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
  },
  splitCardMascot: {
    position: 'absolute',
    right: 4,
    bottom: 4,
  },

  // Section 4: Habits
  habitList: {
    marginTop: 8,
    gap: 8,
  },
  habitItem: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  habitIconBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EEF4E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  habitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: typography.fontFamily.medium,
    color: '#54554B',
  },

  // Section 5: Spending Risks
  risksCard: {
    backgroundColor: '#FFF8EE',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8DDD0',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#745143',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  risksLeft: {
    flex: 1.1,
    gap: 8,
  },
  risksLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  risksLabel: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: '#54554B',
  },
  risksLevel: {
    fontSize: 19,
    fontFamily: typography.fontFamily.bold,
  },
  risksDesc: {
    fontSize: 14,
    lineHeight: 17,
    fontFamily: typography.fontFamily.medium,
    color: '#54554B',
    paddingRight: 6,
  },
  risksRight: {
    flex: 1.4,
    gap: 6,
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#E8DDD0',
    paddingLeft: 12,
  },
  riskCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riskCheckText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: '#54554B',
    flex: 1,
  },
  risksMascot: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    opacity: 0.85,
  },

  // Section 6: Financial Safety
  safetyCard: {
    backgroundColor: '#FFF8EE',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8DDD0',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#745143',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  safetyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  safetyProtectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    gap: 4,
  },
  safetyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  safetyCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  safetyCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF4E6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DDD0',
  },
  safetyLabel: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: '#745143',
    textAlign: 'center',
    height: 40,
  },
  safetyActiveText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: '#3E5A2A',
  },

  // Section 7: Smart Observation
  observationCard: {
    backgroundColor: '#FFF8EE',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8DDD0',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#745143',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  observationList: {
    flex: 1.6,
    gap: 10,
  },
  observationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  observationText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: '#745143',
  },
  observationMascot: {
    flex: 0.9,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginTop: 8,
  },

  // Section 8: Growth Tip
  tipCard: {
    backgroundColor: '#FFF8EE',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8DDD0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#745143',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    minHeight: 88,
  },
  tipLeft: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF4E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipMiddle: {
    flex: 1,
    paddingHorizontal: 10,
    paddingRight: 36,
  },
  tipTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: '#745143',
  },
  tipDesc: {
    fontSize: 14,
    lineHeight: 17,
    fontFamily: typography.fontFamily.medium,
    color: '#54554B',
    marginTop: 1,
  },
  tipPlantDecor: {
    position: 'absolute',
    right: 4,
    bottom: 2,
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#FFF8EE',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8DDD0',
    paddingVertical: 31,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    shadowColor: '#745143',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 23,
    fontFamily: typography.fontFamily.bold,
    color: '#745143',
    textAlign: 'center',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    lineHeight: 19,
    fontFamily: typography.fontFamily.medium,
    color: '#54554B',
    textAlign: 'center',
    paddingHorizontal: 12,
  },

  // Scanner UI styles
  scannerContainer: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    backgroundColor: '#FFF8EE',
    borderColor: '#E8DDD0',
  },
  scannerHeader: {
    fontSize: 16,
    marginBottom: 10,
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily.bold,
    color: '#745143',
  },
  scannerConsole: {
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#FAF9F7',
    borderWidth: 1,
    borderColor: '#E8DDD0',
    minHeight: 176,
    marginBottom: 10,
    justifyContent: 'center',
  },
  consoleLine: {
    fontSize: 13,
    lineHeight: 19,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#EEF4E6',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3E5A2A',
  },
  progressPct: {
    fontSize: 13,
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily.mono,
    color: '#54554B',
  },
});
