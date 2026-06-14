import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  TextInput,
  RefreshControl,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import Svg, { Rect, Circle, Path, Line, Text as SvgText, G } from 'react-native-svg';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/theme-provider';
import { typography, tokens, shadows, spacing, borderRadius } from '@/theme';
import { useTransactionStore } from '@/stores/transaction-store';
import { getMonthlyTotals } from '@/lib/database';
import { getMonthRange } from '@/utils/date';
import { formatCurrency, formatSignedAmount } from '@/utils/currency';
import { formatTime } from '@/utils/date';
import { getCategoryById } from '@/features/categorizer/categorizer';
import { Transaction, TransactionType } from '@/types';
import {
  TransactionSkeleton,
  TabHeader,
  ReadingNotebookMascot,
  LeafCluster,
  CornerPlant,
} from '@/components/ui';

// Theme Constants
const COLOR_BACKGROUND = tokens.colors.tactileBackground;
const COLOR_SURFACE = tokens.colors.surface;
const COLOR_PRIMARY_TEXT = tokens.colors.textPrimary;
const COLOR_SECONDARY_TEXT = tokens.colors.textSecondary;
const COLOR_FOREST_GREEN = tokens.colors.forest;
const COLOR_BORDER = tokens.colors.border;
const COLOR_EXPENSE = tokens.colors.tactileExpense;
const COLOR_SAVINGS = tokens.colors.tactileSavings;
const COLOR_GRID = tokens.colors.tactileGrid;

const TABS: { label: string; value: TransactionType }[] = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Savings', value: 'transfer' }, // Map 'transfer' as 'savings'
];

const { width } = Dimensions.get('window');

type ChartMode = 'day' | 'week' | 'month' | 'year';

interface ChartDataPoint {
  label: string;
  fullLabel: string;
  actual: number;
  budget: number;
  categories: string[];
}

const getTimelineAnalyticsData = (txs: Transaction[], mode: ChartMode, baseDate: Date): ChartDataPoint[] => {
  const now = new Date();
  const isCurrentMonth = baseDate.getFullYear() === now.getFullYear() && baseDate.getMonth() === now.getMonth();
  const dRef = isCurrentMonth ? now : new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);

  if (mode === 'day') {
    const list: ChartDataPoint[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(dRef.getFullYear(), dRef.getMonth(), dRef.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dayTxs = txs.filter(tx => {
        const t = new Date(tx.date).getTime();
        return t >= dayStart && t < dayEnd;
      });

      const actual = dayTxs.reduce((sum, tx) => sum + tx.amount, 0);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const budget = isWeekend ? 1800 : 1000;

      const categoryNames = Array.from(
        new Set(
          dayTxs.map(tx => getCategoryById(tx.categoryId || 'cat_uncategorized').name)
        )
      ).slice(0, 2);

      const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      list.push({
        label: dayNames[d.getDay()],
        fullLabel: `${fullDayNames[d.getDay()]} ${formattedDate}`,
        actual,
        budget,
        categories: categoryNames,
      });
    }
    return list;
  }

  if (mode === 'week') {
    const list: ChartDataPoint[] = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date(dRef.getFullYear(), dRef.getMonth(), dRef.getDate() - (i * 7 + 7)).getTime();
      const end = new Date(dRef.getFullYear(), dRef.getMonth(), dRef.getDate() - (i * 7)).getTime();

      const weekTxs = txs.filter(tx => {
        const t = new Date(tx.date).getTime();
        return t >= start && t < end;
      });

      const actual = weekTxs.reduce((sum, tx) => sum + tx.amount, 0);
      const budget = 8000;

      const categoryNames = Array.from(
        new Set(
          weekTxs.map(tx => getCategoryById(tx.categoryId || 'cat_uncategorized').name)
        )
      ).slice(0, 2);

      list.push({
        label: i === 0 ? 'This Wk' : `W-${i}`,
        fullLabel: i === 0 ? 'Current Week' : `Week - ${i} Ago`,
        actual,
        budget,
        categories: categoryNames,
      });
    }
    return list;
  }

  if (mode === 'month') {
    const list: ChartDataPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(dRef.getFullYear(), dRef.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();

      const monthStart = new Date(year, month, 1).getTime();
      const monthEnd = new Date(year, month + 1, 1).getTime();

      const monthTxs = txs.filter(tx => {
        const t = new Date(tx.date).getTime();
        return t >= monthStart && t < monthEnd;
      });

      const actual = monthTxs.reduce((sum, tx) => sum + tx.amount, 0);
      const budget = 30000;

      const categoryNames = Array.from(
        new Set(
          monthTxs.map(tx => getCategoryById(tx.categoryId || 'cat_uncategorized').name)
        )
      ).slice(0, 2);

      list.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        fullLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        actual,
        budget,
        categories: categoryNames,
      });
    }
    return list;
  }

  if (mode === 'year') {
    const list: ChartDataPoint[] = [];
    for (let i = 2; i >= 0; i--) {
      const year = dRef.getFullYear() - i;
      const yearStart = new Date(year, 0, 1).getTime();
      const yearEnd = new Date(year + 1, 0, 1).getTime();

      const yearTxs = txs.filter(tx => {
        const t = new Date(tx.date).getTime();
        return t >= yearStart && t < yearEnd;
      });

      const actual = yearTxs.reduce((sum, tx) => sum + tx.amount, 0);
      const budget = 360000;

      const categoryNames = Array.from(
        new Set(
          yearTxs.map(tx => getCategoryById(tx.categoryId || 'cat_uncategorized').name)
        )
      ).slice(0, 2);

      list.push({
        label: String(year),
        fullLabel: `Year ${year}`,
        actual,
        budget,
        categories: categoryNames,
      });
    }
    return list;
  }

  return [];
};

// Search & Filter SVGs
const SearchSvg = React.memo(() => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={COLOR_PRIMARY_TEXT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={11} cy={11} r={8} />
    <Line x1={21} y1={21} x2={16.65} y2={16.65} />
  </Svg>
));

const FilterSvg = React.memo(() => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={COLOR_PRIMARY_TEXT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 6h16M6 12h12M8 18h8" />
  </Svg>
));

const ChevronRight = React.memo(() => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={COLOR_PRIMARY_TEXT} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 18l6-6-6-6" />
  </Svg>
));

// Editorial Text-based Category Icon
const CategoryIcon = React.memo(({ categoryName, merchantName }: { categoryName: string; merchantName: string | null }) => {
  const displayLetter = (merchantName || categoryName || 'O').charAt(0).toUpperCase();
  const colors = ['#A86A2A', '#3E5A2A', '#AFA56A', '#745143', '#B7884E', '#8C9168'];
  const charCode = displayLetter.charCodeAt(0) || 0;
  const color = colors[charCode % colors.length];

  return (
    <View style={[styles.txIcon, { backgroundColor: color + '15', borderColor: color + '30' }]}>
      <Text style={[styles.txIconText, { color }]}>{displayLetter}</Text>
    </View>
  );
});

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();

  // Local States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [refreshing, setRefreshing] = useState(false);
  const [chartMode, setChartMode] = useState<ChartMode>('day');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // Redesign local states
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [monthlyStats, setMonthlyStats] = useState({ totalIncome: 0, totalExpense: 0, netSavings: 0 });

  // Store bindings
  const { transactions, loadTransactions, setFilter, isLoading, categories, loadCategories } = useTransactionStore();

  const timelineData = useMemo(() => {
    return getTimelineAnalyticsData(transactions, chartMode, selectedMonth);
  }, [transactions, chartMode, selectedMonth]);

  const maxAmount = useMemo(() => {
    return Math.max(...timelineData.map((d) => Math.max(d.actual, d.budget)), 1000);
  }, [timelineData]);

  // Initial and reactive data fetching
  const fetchStats = useCallback(async () => {
    try {
      const { start, end } = getMonthRange(selectedMonth);
      const totals = await getMonthlyTotals(start, end);
      const net = totals.totalIncome - totals.totalExpense;
      setMonthlyStats({
        totalIncome: totals.totalIncome,
        totalExpense: totals.totalExpense,
        netSavings: net,
      });
    } catch (e) {
      console.warn('Failed to fetch monthly stats:', e);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const { start, end } = getMonthRange(selectedMonth);
    setFilter({
      type: activeTab,
      searchQuery: searchQuery || undefined,
      categoryId: selectedCategory || undefined,
      dateFrom: start,
      dateTo: end,
    });
    fetchStats();
  }, [selectedMonth, activeTab, searchQuery, selectedCategory, fetchStats]);

  const handleTabChange = (tab: TransactionType) => {
    setActiveTab(tab);
    setSelectedDayIndex(null);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const { start, end } = getMonthRange(selectedMonth);
    await Promise.all([
      loadTransactions({
        type: activeTab,
        searchQuery: searchQuery || undefined,
        categoryId: selectedCategory || undefined,
        dateFrom: start,
        dateTo: end,
      }),
      fetchStats(),
    ]);
    setRefreshing(false);
  }, [selectedMonth, activeTab, searchQuery, selectedCategory, fetchStats, loadTransactions]);

  // Chronological Grouping Logic
  const getGroupedSections = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 1000 * 60 * 60 * 24;
    const startOfWeek = today - 1000 * 60 * 60 * 24 * 7;

    const todayTxs: Transaction[] = [];
    const yesterdayTxs: Transaction[] = [];
    const thisWeekTxs: Transaction[] = [];
    const earlierTxs: Transaction[] = [];

    transactions.forEach((tx) => {
      const txTime = new Date(tx.date).getTime();
      if (txTime >= today) {
        todayTxs.push(tx);
      } else if (txTime >= yesterday) {
        yesterdayTxs.push(tx);
      } else if (txTime >= startOfWeek) {
        thisWeekTxs.push(tx);
      } else {
        earlierTxs.push(tx);
      }
    });

    const sections: { title: string; data: Transaction[] }[] = [];
    if (todayTxs.length > 0) sections.push({ title: 'Today', data: todayTxs });
    if (yesterdayTxs.length > 0) sections.push({ title: 'Yesterday', data: yesterdayTxs });
    if (thisWeekTxs.length > 0) sections.push({ title: 'This Week', data: thisWeekTxs });
    if (earlierTxs.length > 0) sections.push({ title: 'Earlier', data: earlierTxs });

    return sections;
  };

  const sections = getGroupedSections();

  // Dynamic Spending Observation
  const getFinancialObservation = () => {
    if (transactions.length === 0) {
      return "No spending data available for observations yet.";
    }

    const categorySpending: Record<string, number> = {};
    transactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        const category = getCategoryById(tx.categoryId || 'cat_uncategorized');
        categorySpending[category.name] = (categorySpending[category.name] || 0) + tx.amount;
      });

    const categoriesList = Object.keys(categorySpending);
    if (categoriesList.length === 0) {
      return "No expenses recorded this month.";
    }

    let maxCategory = categoriesList[0];
    let maxAmt = categorySpending[maxCategory];
    for (const cat of categoriesList) {
      if (categorySpending[cat] > maxAmt) {
        maxCategory = cat;
        maxAmt = categorySpending[cat];
      }
    }

    return `Most spending this month comes from ${maxCategory}.`;
  };

  // List of last 12 months for picker
  const getMonthsList = () => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push(d);
    }
    return list;
  };

  const renderTransaction = ({ item: tx }: { item: Transaction }) => {
    const category = getCategoryById(tx.categoryId || 'cat_uncategorized');
    return (
      <Pressable
        style={({ pressed }) => [
          styles.txCard,
          pressed && { opacity: 0.7, transform: [{ scale: 0.99 }] }
        ]}
        onPress={() => router.push(`/transaction/${tx.id}`)}
      >
        <CategoryIcon categoryName={category.name} merchantName={tx.merchant} />

        <View style={styles.txInfo}>
          <Text style={styles.txMerchant} numberOfLines={1}>
            {tx.merchant || category.name}
          </Text>
          <Text style={styles.txMeta}>
            {category.name}
          </Text>
        </View>

        <View style={styles.txRight}>
          <Text style={styles.txTime}>
            {formatTime(tx.date)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Text
              style={[
                styles.txAmount,
                { color: tx.type === 'income' ? COLOR_FOREST_GREEN : COLOR_EXPENSE },
              ]}
            >
              {formatSignedAmount(tx.amount, tx.type)}
            </Text>
            <ChevronRight />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TabHeader
        microHeader="FINANCIAL NOTEBOOK"
        title="History"
        subtitle="Review where your money has been."
        variant="tactile"
        style={{ paddingHorizontal: 16, paddingTop: 16, marginBottom: 12 }}
        renderRight={() => (
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => setMonthPickerVisible(true)}
              style={({ pressed }) => [
                styles.monthSelectorBtn,
                pressed && { opacity: 0.8 }
              ]}
            >
              <Text style={styles.monthSelectorText}>
                {selectedMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} ▾
              </Text>
            </Pressable>
            <ReadingNotebookMascot width={90} height={72} />
          </View>
        )}
      />

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <SearchSvg />
          <TextInput
            style={styles.searchInput}
            placeholder="Search details..."
            placeholderTextColor="#8E8A82"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {selectedCategory || searchQuery ? (
            <Pressable onPress={handleClearFilters} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => setCategoryPickerVisible(true)}
            style={({ pressed }) => [
              styles.filterBtn,
              pressed && { opacity: 0.7 }
            ]}
          >
            <FilterSvg />
            {selectedCategory && <View style={styles.filterDot} />}
          </Pressable>
        </View>
      </View>

      {/* Segmented Pills Control */}
      <View style={styles.tabSliderWrapper}>
        {TABS.map((tab) => {
          const isSelected = activeTab === tab.value;
          return (
            <Pressable
              key={tab.value}
              onPress={() => handleTabChange(tab.value)}
              style={[
                styles.tabButton,
                {
                  backgroundColor: isSelected ? COLOR_FOREST_GREEN : COLOR_SURFACE,
                  borderColor: isSelected ? COLOR_FOREST_GREEN : COLOR_BORDER,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isSelected ? '#FFF' : COLOR_PRIMARY_TEXT,
                    fontFamily: isSelected ? typography.fontFamily.bold : typography.fontFamily.regular,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Grouped Chronological List */}
      {isLoading && transactions.length === 0 ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <TransactionSkeleton />
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderTransaction}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>
                {title.toUpperCase()}
              </Text>
              <View style={styles.sectionDivider} />
            </View>
          )}
          ListHeaderComponent={
            <View>
              {/* Monthly Snapshot Card */}
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Monthly Snapshot</Text>
                    <View style={styles.snapshotRow}>
                      <View style={styles.snapshotCol}>
                        <Text style={styles.snapshotLabel}>INCOME</Text>
                        <Text style={[styles.snapshotValue, { color: COLOR_FOREST_GREEN }]}>
                          {formatCurrency(monthlyStats.totalIncome)}
                        </Text>
                      </View>
                      <View style={[styles.snapshotCol, { borderLeftWidth: 1, borderLeftColor: COLOR_BORDER, borderRightWidth: 1, borderRightColor: COLOR_BORDER }]}>
                        <Text style={styles.snapshotLabel}>EXPENSE</Text>
                        <Text style={[styles.snapshotValue, { color: COLOR_EXPENSE }]}>
                          {formatCurrency(monthlyStats.totalExpense)}
                        </Text>
                      </View>
                      <View style={styles.snapshotCol}>
                        <Text style={styles.snapshotLabel}>SAVINGS</Text>
                        <Text style={[styles.snapshotValue, { color: COLOR_FOREST_GREEN }]}>
                          {formatCurrency(monthlyStats.netSavings)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.leafClusterContainer}>
                    <LeafCluster />
                  </View>
                </View>
                <View style={styles.cornerPlantDecoration} pointerEvents="none">
                  <CornerPlant />
                </View>
              </View>

              {/* Spending Trend (Reduced Chart Height Card) */}
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Text style={styles.cardTitle}>
                    {activeTab.toUpperCase()} TREND
                  </Text>
                  <View style={styles.chartModeSelector}>
                    {(['day', 'week', 'month', 'year'] as ChartMode[]).map((mode) => {
                      const isSelected = chartMode === mode;
                      return (
                        <Pressable
                          key={mode}
                          onPress={() => {
                            setChartMode(mode);
                            setSelectedDayIndex(null);
                          }}
                          style={[
                            styles.chartModeButton,
                            isSelected && { backgroundColor: COLOR_FOREST_GREEN },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chartModeLabel,
                              {
                                color: isSelected ? '#FFF' : COLOR_PRIMARY_TEXT,
                                fontFamily: isSelected ? typography.fontFamily.bold : typography.fontFamily.regular,
                              },
                            ]}
                          >
                            {mode.toUpperCase()}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Svg Analytics Chart */}
                <View style={styles.chartWrapperContainer}>
                  <Svg width="100%" height={150} viewBox="0 0 320 150">
                    {/* Dashed Grid Lines */}
                    {[20, 55, 90, 125].map((yVal, idx) => (
                      <Line
                        key={idx}
                        x1={25}
                        y1={yVal}
                        x2={295}
                        y2={yVal}
                        stroke={COLOR_GRID}
                        strokeDasharray="3 3"
                        strokeWidth={1}
                      />
                    ))}

                    {/* Columns (Budget vs Actual) */}
                    {timelineData.map((d, idx) => {
                      const N = timelineData.length;
                      const x = 30 + idx * (260 / (N > 1 ? N - 1 : 1));
                      const yActual = 125 - (d.actual / maxAmount) * 105;
                      const yBudget = 125 - (d.budget / maxAmount) * 105;
                      const isSelected = selectedDayIndex === idx;

                      const activeColor = activeTab === 'expense'
                        ? COLOR_EXPENSE
                        : activeTab === 'income'
                          ? COLOR_FOREST_GREEN
                          : COLOR_SAVINGS;

                      return (
                        <G key={idx}>
                          {/* Background Budget Column */}
                          <Rect
                            x={x - 6}
                            y={yBudget}
                            width={12}
                            height={125 - yBudget}
                            fill={activeColor}
                            fillOpacity={0.08}
                            rx={3}
                            ry={3}
                          />

                          {/* Foreground Actual Column */}
                          <Rect
                            x={x - (isSelected ? 5 : 3)}
                            y={yActual}
                            width={isSelected ? 10 : 6}
                            height={125 - yActual}
                            fill={activeColor}
                            rx={2}
                            ry={2}
                          />

                          {/* Axis Text Label */}
                          <SvgText
                            x={x}
                            y={142}
                            fill={COLOR_SECONDARY_TEXT}
                            fontSize={9}
                            fontFamily={typography.fontFamily.medium}
                            textAnchor="middle"
                          >
                            {d.label}
                          </SvgText>
                        </G>
                      );
                    })}

                    {/* Transparent Interactive Rect Overlays */}
                    {timelineData.map((d, idx) => {
                      const N = timelineData.length;
                      const x = 30 + idx * (260 / (N > 1 ? N - 1 : 1));
                      return (
                        <Rect
                          key={idx}
                          x={x - 22}
                          y={10}
                          width={44}
                          height={125}
                          fill="transparent"
                          onPress={() => {
                            setSelectedDayIndex(selectedDayIndex === idx ? null : idx);
                          }}
                        />
                      );
                    })}

                    {/* Tooltip */}
                    {selectedDayIndex !== null && (() => {
                      const N = timelineData.length;
                      const d = timelineData[selectedDayIndex];
                      const x = 30 + selectedDayIndex * (260 / (N > 1 ? N - 1 : 1));
                      const yActual = 125 - (d.actual / maxAmount) * 105;

                      let tooltipX = x - 65;
                      if (tooltipX < 10) tooltipX = 10;
                      if (tooltipX > 180) tooltipX = 180;

                      let tooltipY = yActual - 56;
                      if (tooltipY < 15) tooltipY = yActual + 15;

                      return (
                        <G pointerEvents="none">
                          <Rect
                            x={tooltipX}
                            y={tooltipY}
                            width={130}
                            height={48}
                            fill={COLOR_SURFACE}
                            stroke={COLOR_BORDER}
                            strokeWidth="1"
                            rx={8}
                            ry={8}
                          />
                          <SvgText
                            x={tooltipX + 8}
                            y={tooltipY + 14}
                            fill={COLOR_PRIMARY_TEXT}
                            fontSize={9}
                            fontWeight="bold"
                            fontFamily={typography.fontFamily.bold}
                          >
                            {d.fullLabel}
                          </SvgText>
                          <SvgText
                            x={tooltipX + 8}
                            y={tooltipY + 27}
                            fill={COLOR_PRIMARY_TEXT}
                            fontSize={8.5}
                            fontFamily={typography.fontFamily.medium}
                          >
                            Amt: ₹{Math.round(d.actual)} (Limit: ₹{d.budget})
                          </SvgText>
                          <SvgText
                            x={tooltipX + 8}
                            y={tooltipY + 38}
                            fill={COLOR_SECONDARY_TEXT}
                            fontSize={7}
                            fontFamily={typography.fontFamily.regular}
                          >
                            {d.categories.length > 0 ? d.categories.join(', ') : 'No activity'}
                          </SvgText>
                        </G>
                      );
                    })()}
                  </Svg>
                </View>
                <View style={styles.cornerPlantDecoration} pointerEvents="none">
                  <CornerPlant />
                </View>
              </View>
            </View>
          }
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLOR_PRIMARY_TEXT} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <ReadingNotebookMascot />
              <Text style={styles.emptyText}>
                No transactions yet.
              </Text>
              <Text style={styles.emptySubtitle}>
                Your spending story will appear here.
              </Text>
              <View style={styles.cornerPlantDecoration} pointerEvents="none">
                <CornerPlant />
              </View>
            </View>
          }
          ListFooterComponent={
            <View style={{ paddingBottom: 140 }}>
              {/* Financial Observation Card */}
              {transactions.length > 0 && (
                <View style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1.2, paddingRight: 8 }}>
                      <Text style={styles.cardTitle}>Financial Observation</Text>
                      <Text style={styles.observationText}>
                        {getFinancialObservation()}
                      </Text>
                    </View>
                    <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                      <ReadingNotebookMascot />
                    </View>
                  </View>
                  <View style={styles.cornerPlantDecoration} pointerEvents="none">
                    <CornerPlant />
                  </View>
                </View>
              )}
            </View>
          }
        />
      )}

      {/* Month Picker Modal */}
      <Modal
        visible={monthPickerVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setMonthPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Month</Text>
              <Pressable onPress={() => setMonthPickerVisible(false)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalScroll}>
              {getMonthsList().map((date, idx) => {
                const isSelected =
                  date.getFullYear() === selectedMonth.getFullYear() &&
                  date.getMonth() === selectedMonth.getMonth();
                return (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      setSelectedMonth(date);
                      setMonthPickerVisible(false);
                    }}
                    style={[
                      styles.modalItem,
                      { backgroundColor: isSelected ? COLOR_FOREST_GREEN : 'transparent' }
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        { color: isSelected ? '#FFF' : COLOR_PRIMARY_TEXT },
                      ]}
                    >
                      {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Filter Modal */}
      <Modal
        visible={categoryPickerVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCategoryPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Category</Text>
              <Pressable onPress={() => setCategoryPickerVisible(false)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Pressable
                onPress={() => {
                  setSelectedCategory(null);
                  setCategoryPickerVisible(false);
                }}
                style={[
                  styles.modalItem,
                  { backgroundColor: selectedCategory === null ? COLOR_FOREST_GREEN : 'transparent' }
                ]}
              >
                <Text style={[styles.modalItemText, { color: selectedCategory === null ? '#FFF' : COLOR_PRIMARY_TEXT }]}>
                  All Categories
                </Text>
              </Pressable>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      setSelectedCategory(cat.id);
                      setCategoryPickerVisible(false);
                    }}
                    style={[
                      styles.modalItem,
                      { backgroundColor: isSelected ? COLOR_FOREST_GREEN : 'transparent' }
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        { color: isSelected ? '#FFF' : COLOR_PRIMARY_TEXT },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR_BACKGROUND,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  microHeader: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: COLOR_SECONDARY_TEXT,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontFamily: typography.fontFamily.bold,
    color: COLOR_PRIMARY_TEXT,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: COLOR_SECONDARY_TEXT,
    marginTop: spacing.xs,
  },
  monthSelectorBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    backgroundColor: COLOR_SURFACE,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    alignSelf: 'flex-end',
  },
  monthSelectorText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    color: COLOR_PRIMARY_TEXT,
  },

  // Search Bar
  searchWrapper: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    backgroundColor: COLOR_SURFACE,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    paddingHorizontal: spacing.base,
    height: 56,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingLeft: spacing.md,
    color: COLOR_PRIMARY_TEXT,
    fontFamily: typography.fontFamily.medium,
  },
  clearBtn: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: 10,
    marginRight: spacing.sm,
  },
  clearBtnText: {
    color: COLOR_PRIMARY_TEXT,
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
  },
  filterBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    position: 'relative',
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLOR_FOREST_GREEN,
  },

  // Segmented control
  tabSliderWrapper: {
    flexDirection: 'row',
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  tabButton: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.tactileTabButton,
  },
  tabLabel: {
    fontSize: 13,
  },

  // List layout
  listContent: {
    paddingHorizontal: spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    backgroundColor: COLOR_BACKGROUND,
    gap: spacing.md,
  },
  sectionHeaderText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: COLOR_SECONDARY_TEXT,
    letterSpacing: 1.5,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: COLOR_BORDER,
    opacity: 0.8,
  },

  // Transaction card
  txCard: {
    backgroundColor: COLOR_SURFACE,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    ...shadows.tactileRaisedCard,
    padding: spacing.md,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  txIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txIconText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
  },
  txInfo: {
    flex: 1,
  },
  txMerchant: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: COLOR_PRIMARY_TEXT,
    marginBottom: 2,
  },
  txMeta: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
    color: COLOR_SECONDARY_TEXT,
  },
  txRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  txTime: {
    fontSize: 9,
    fontFamily: typography.fontFamily.regular,
    color: COLOR_SECONDARY_TEXT,
  },
  txAmount: {
    fontSize: 14,
    fontFamily: typography.fontFamily.monoBold,
  },

  // Cards layout
  card: {
    backgroundColor: COLOR_SURFACE,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    ...shadows.tactileRaisedCard,
    padding: spacing.base,
    marginBottom: spacing.base,
    position: 'relative',
    overflow: 'hidden',
  },
  chartCard: {
    backgroundColor: COLOR_SURFACE,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    ...shadows.tactileRaisedCard,
    padding: spacing.base,
    marginBottom: spacing.base,
    height: 240,
    position: 'relative',
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: COLOR_SECONDARY_TEXT,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  observationText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: COLOR_PRIMARY_TEXT,
    lineHeight: 20,
  },

  // Snapshot details
  snapshotRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  snapshotCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 9,
    color: COLOR_SECONDARY_TEXT,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  snapshotValue: {
    fontFamily: typography.fontFamily.monoBold,
    fontSize: 15,
  },
  leafClusterContainer: {
    marginLeft: spacing.sm,
    marginTop: -spacing.sm,
  },
  cornerPlantDecoration: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.1,
  },

  // Chart layout
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chartModeSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: borderRadius.md,
    padding: 2,
    backgroundColor: COLOR_SURFACE,
  },
  chartModeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 10,
  },
  chartModeLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  chartWrapperContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },

  // Empty state
  empty: {
    backgroundColor: COLOR_SURFACE,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    ...shadows.tactileRaisedCard,
    padding: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: COLOR_PRIMARY_TEXT,
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: COLOR_SECONDARY_TEXT,
    textAlign: 'center',
  },

  // Modals layout
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(116, 81, 67, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLOR_SURFACE,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    width: '100%',
    maxHeight: '70%',
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
    ...shadows.tactileRaisedCard,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    color: COLOR_PRIMARY_TEXT,
  },
  modalCloseButton: {
    width: spacing.xxl,
    height: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: COLOR_SECONDARY_TEXT,
  },
  modalScroll: {
    paddingHorizontal: spacing.base,
  },
  modalItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs + 2,
  },
  modalItemText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
  },
});
