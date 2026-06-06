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
  LayoutAnimation,
} from 'react-native';
import Svg, { Rect, Path, Circle, Text as SvgText, G, Line } from 'react-native-svg';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/theme-provider';
import { typography, spacing } from '@/theme';
import { useTransactionStore } from '@/stores/transaction-store';
import { formatCurrency, formatSignedAmount } from '@/utils/currency';
import { formatDate, formatTime } from '@/utils/date';
import { getCategoryById } from '@/features/categorizer/categorizer';
import { Transaction, TransactionType } from '@/types';
import { TransactionSkeleton } from '@/components/ui/Skeleton';

const TABS: { label: string; value: TransactionType }[] = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Savings', value: 'transfer' }, // Map 'transfer' as 'savings'
];

const { width } = Dimensions.get('window');

function getCategoryEmoji(iconName: string): string {
  const emojiMap: Record<string, string> = {
    'utensils': '🍔', 'shopping-cart': '🛒', 'car': '🚗', 'home': '🏠',
    'shopping-bag': '🛍️', 'heart-pulse': '💊', 'film': '🎬', 'receipt': '📱',
    'graduation-cap': '📚', 'wallet': '💰', 'arrow-right-left': '💸', 'circle-help': '❓',
  };
  return emojiMap[iconName] || '💰';
}

type ChartMode = 'day' | 'week' | 'month' | 'year';

interface ChartDataPoint {
  label: string;
  fullLabel: string;
  actual: number;
  budget: number;
  categories: string[];
}

const formatChartAmount = (amount: number) => {
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k`;
  }
  return Math.round(amount).toString();
};

const getTimelineAnalyticsData = (txs: Transaction[], mode: ChartMode): ChartDataPoint[] => {
  const now = new Date();
  
  if (mode === 'day') {
    const list: ChartDataPoint[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
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
        fullLabel: `${fullDayNames[d.getDay()]}, ${formattedDate}`,
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
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7 + 7)).getTime();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7)).getTime();
      
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
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
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
      const year = now.getFullYear() - i;
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

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [refreshing, setRefreshing] = useState(false);
  const [chartMode, setChartMode] = useState<ChartMode>('day');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  const { transactions, loadTransactions, setFilter, isLoading } = useTransactionStore();

  const timelineData = useMemo(() => {
    return getTimelineAnalyticsData(transactions, chartMode);
  }, [transactions, chartMode]);

  const maxAmount = useMemo(() => {
    return Math.max(...timelineData.map((d) => Math.max(d.actual, d.budget)), 1000);
  }, [timelineData]);

  useEffect(() => {
    // Initial filter setup
    setFilter({
      type: activeTab,
      searchQuery: searchQuery || undefined,
    });
  }, []);

  const handleTabChange = (tab: TransactionType) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
    setSelectedDayIndex(null);
    setFilter({
      type: tab,
      searchQuery: searchQuery || undefined,
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilter({
      type: activeTab,
      searchQuery: query || undefined,
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  }, []);

  // Chronological Grouping Logic
  const getGroupedSections = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 1000 * 60 * 60 * 24;
    
    // Start of the week: 7 days ago
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

  const renderTransaction = ({ item: tx }: { item: Transaction }) => {
    const category = getCategoryById(tx.categoryId || 'cat_uncategorized');
    return (
      <Pressable
        style={({ pressed }) => [
          styles.txRow,
          { borderBottomColor: theme.borderLight },
          pressed && { opacity: 0.7 }
        ]}
        onPress={() => router.push(`/transaction/${tx.id}`)}
      >
        <View style={[styles.txIcon, { backgroundColor: theme.primary + '20', borderColor: theme.border }]}>
          <Text style={styles.txIconText}>{getCategoryEmoji(category.icon)}</Text>
        </View>
        <View style={styles.txInfo}>
          <Text style={[styles.txMerchant, { color: theme.text, fontFamily: typography.fontFamily.bold }]} numberOfLines={1}>
            {tx.merchant || category.name}
          </Text>
          <Text style={[styles.txMeta, { color: theme.textSecondary }]}>
            {formatTime(tx.date)} · {category.name}
          </Text>
        </View>
        <View style={styles.txRight}>
          <Text
            style={[
              styles.txAmount,
              {
                color: tx.type === 'income' ? theme.income : theme.expense,
                fontFamily: typography.fontFamily.monoBold,
              },
            ]}
          >
            {formatSignedAmount(tx.amount, tx.type)}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.microHeader, { color: theme.textSecondary }]}>LEDGER SYSTEM</Text>
          <Text style={[styles.title, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>Transactions</Text>
        </View>
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

      {/* Search Input (Tactile paper look) */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search details..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {/* Sliding Tabs Indicator Row */}
      <View style={[styles.tabSliderWrapper, { borderColor: theme.border, backgroundColor: theme.card }]}>
        {TABS.map((tab) => {
          const isSelected = activeTab === tab.value;
          return (
            <Pressable
              key={tab.value}
              onPress={() => handleTabChange(tab.value)}
              style={[
                styles.tabButton,
                isSelected && {
                  backgroundColor: theme.primary,
                  borderColor: theme.border,
                  borderWidth: 1,
                  borderRadius: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isSelected ? '#1B1B1B' : theme.textSecondary,
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
            <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
              <Text style={[styles.sectionHeaderText, { color: theme.textSecondary, fontFamily: typography.fontFamily.bold }]}>
                {title.toUpperCase()}
              </Text>
              <View style={[styles.sectionDivider, { backgroundColor: theme.border }]} />
            </View>
          )}
          ListHeaderComponent={
            <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.chartHeader}>
                <Text style={[styles.chartTitle, { color: theme.textSecondary, fontFamily: typography.fontFamily.bold }]}>
                  {activeTab.toUpperCase()} ANALYTICS
                </Text>
                <View style={[styles.chartModeSelector, { borderColor: theme.border }]}>
                  {(['day', 'week', 'month', 'year'] as ChartMode[]).map((mode) => {
                    const isSelected = chartMode === mode;
                    return (
                      <Pressable
                        key={mode}
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setChartMode(mode);
                          setSelectedDayIndex(null);
                        }}
                        style={[
                          styles.chartModeButton,
                          isSelected && { backgroundColor: theme.primary },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chartModeLabel,
                            {
                              color: isSelected ? '#1B1B1B' : theme.textSecondary,
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

              {/* Dynamic Svg Analytics Chart */}
              <View style={styles.chartWrapperContainer}>
                <Svg width="100%" height={180} viewBox="0 0 320 180">
                  {/* Dashed Grid Lines (low contrast) */}
                  {[30, 68, 106, 145].map((yVal, idx) => (
                    <Line
                      key={idx}
                      x1={30}
                      y1={yVal}
                      x2={290}
                      y2={yVal}
                      stroke="#1F1F1F"
                      strokeOpacity={0.08}
                      strokeDasharray="3 3"
                      strokeWidth={1}
                    />
                  ))}

                  {/* Columns (Budget vs Actual) */}
                  {timelineData.map((d, idx) => {
                    const N = timelineData.length;
                    const x = 30 + idx * (260 / (N > 1 ? N - 1 : 1));
                    const yActual = 145 - (d.actual / maxAmount) * 115;
                    const yBudget = 145 - (d.budget / maxAmount) * 115;
                    const isSelected = selectedDayIndex === idx;

                    return (
                      <G key={idx}>
                        {/* Background Budget Column */}
                        <Rect
                          x={x - 4}
                          y={yBudget}
                          width={8}
                          height={145 - yBudget}
                          fill="#1F1F1F"
                          fillOpacity={0.08}
                          rx={2.5}
                          ry={2.5}
                        />

                        {/* Foreground Actual Column */}
                        <Rect
                          x={x - (isSelected ? 3 : 2)}
                          y={yActual}
                          width={isSelected ? 6 : 4}
                          height={145 - yActual}
                          fill={d.actual > d.budget ? '#C84B31' : '#A0C42C'}
                          rx={1.5}
                          ry={1.5}
                        />

                        {/* Axis Text Label */}
                        <SvgText
                          x={x}
                          y={162}
                          fill="#666666"
                          fontSize={8}
                          fontFamily="Poppins"
                          textAnchor="middle"
                        >
                          {d.label}
                        </SvgText>
                      </G>
                    );
                  })}

                  {/* Spline Trend Line */}
                  {(() => {
                    const N = timelineData.length;
                    const pts = timelineData.map((d, idx) => {
                      const x = 30 + idx * (260 / (N > 1 ? N - 1 : 1));
                      const yActual = 145 - (d.actual / maxAmount) * 115;
                      return { x, yActual };
                    });

                    if (pts.length === 0) return null;
                    let pathD = `M ${pts[0].x} ${pts[0].yActual}`;
                    for (let i = 0; i < pts.length - 1; i++) {
                      const p0 = pts[i];
                      const p1 = pts[i + 1];
                      const dx = (p1.x - p0.x) * 0.35;
                      const cp1x = p0.x + dx;
                      const cp1y = p0.yActual;
                      const cp2x = p1.x - dx;
                      const cp2y = p1.yActual;
                      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.yActual}`;
                    }

                    return (
                      <Path
                        d={pathD}
                        fill="none"
                        stroke="#A0C42C"
                        strokeWidth="1.5"
                      />
                    );
                  })()}

                  {/* Circular Indicator on Current Day/Interval */}
                  {(() => {
                    const N = timelineData.length;
                    const activeIdx = selectedDayIndex !== null ? selectedDayIndex : (chartMode === 'day' ? N - 1 : null);
                    if (activeIdx === null || activeIdx < 0 || activeIdx >= N) return null;

                    const d = timelineData[activeIdx];
                    const x = 30 + activeIdx * (260 / (N > 1 ? N - 1 : 1));
                    const yActual = 145 - (d.actual / maxAmount) * 115;

                    return (
                      <Circle
                        cx={x}
                        cy={yActual}
                        r={5}
                        fill="#FDFCF8"
                        stroke="#A0C42C"
                        strokeWidth="2.5"
                      />
                    );
                  })()}

                  {/* Transparent Interactive Rect Overlays */}
                  {timelineData.map((d, idx) => {
                    const N = timelineData.length;
                    const x = 30 + idx * (260 / (N > 1 ? N - 1 : 1));
                    return (
                      <Rect
                        key={idx}
                        x={x - 18}
                        y={15}
                        width={36}
                        height={135}
                        fill="transparent"
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setSelectedDayIndex(selectedDayIndex === idx ? null : idx);
                        }}
                      />
                    );
                  })}

                  {/* Tooltip rendering */}
                  {selectedDayIndex !== null && (() => {
                    const N = timelineData.length;
                    const d = timelineData[selectedDayIndex];
                    const x = 30 + selectedDayIndex * (260 / (N > 1 ? N - 1 : 1));
                    const yActual = 145 - (d.actual / maxAmount) * 115;

                    let tooltipX = x - 60;
                    if (tooltipX < 10) tooltipX = 10;
                    if (tooltipX > 200) tooltipX = 200;

                    let tooltipY = yActual - 52;
                    if (tooltipY < 20) tooltipY = yActual + 12;

                    return (
                      <G pointerEvents="none">
                        <Rect
                          x={tooltipX}
                          y={tooltipY}
                          width={120}
                          height={44}
                          fill="#FDFCF8"
                          stroke="#1F1F1F"
                          strokeWidth="1"
                          strokeOpacity={0.1}
                          rx={4}
                          ry={4}
                        />
                        <SvgText
                          x={tooltipX + 8}
                          y={tooltipY + 13}
                          fill="#1B1B1B"
                          fontSize={8}
                          fontWeight="bold"
                          fontFamily="Poppins"
                        >
                          {d.fullLabel}
                        </SvgText>
                        <SvgText
                          x={tooltipX + 8}
                          y={tooltipY + 25}
                          fill="#1B1B1B"
                          fontSize={8}
                          fontFamily="Poppins"
                        >
                          Spent: ₹{Math.round(d.actual)} (Budget: ₹{d.budget})
                        </SvgText>
                        <SvgText
                          x={tooltipX + 8}
                          y={tooltipY + 35}
                          fill="#666666"
                          fontSize={6.5}
                          fontFamily="Poppins"
                        >
                          {d.categories.length > 0 ? d.categories.join(', ') : 'No spending'}
                        </SvgText>
                      </G>
                    );
                  })()}
                </Svg>
              </View>
            </View>
          }
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No records found
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  title: { fontSize: 28, letterSpacing: -0.5 },

  searchWrapper: { paddingHorizontal: 16, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },

  tabSliderWrapper: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 4,
    padding: 4,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 14,
  },

  listContent: { paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  sectionHeaderText: {
    fontSize: 10,
    letterSpacing: 1.5,
  },
  sectionDivider: {
    flex: 1,
    height: 0.5,
    opacity: 0.5,
  },
  txRow: {
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
  txMeta: { fontSize: 12 },
  txRight: { alignItems: 'flex-end', justifyContent: 'center' },
  txAmount: { fontSize: 15 },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15 },
  chartCard: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 10,
    letterSpacing: 1.5,
  },
  chartModeSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 4,
    padding: 2,
    alignItems: 'center',
  },
  chartModeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  chartModeLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  chartWrapperContainer: {
    paddingTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
