import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/theme-provider';
import { typography, spacing, borderRadius } from '@/theme';
import { useTransactionStore } from '@/stores/transaction-store';
import { formatCurrency, formatCompact } from '@/utils/currency';
import { getMonthLabel, getMonthRange, getLast7Days } from '@/utils/date';
import * as db from '@/lib/database';

const { width } = Dimensions.get('window');
const CHART_HEIGHT = 160;
const BAR_WIDTH = 28;

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { monthlyTotals, categoryTotals, loadMonthlyStats } = useTransactionStore();
  const [dailyData, setDailyData] = useState<{ day: string; income: number; expense: number }[]>([]);

  useEffect(() => {
    loadMonthlyStats();
    loadDailyData();
  }, []);

  const loadDailyData = async () => {
    const { start, end } = getMonthRange();
    const data = await db.getDailyTotals(start, end);
    setDailyData(data);
  };

  const maxDailyExpense = Math.max(...dailyData.map((d) => d.expense), 1);
  const savingsRate = monthlyTotals.totalIncome > 0
    ? ((monthlyTotals.totalIncome - monthlyTotals.totalExpense) / monthlyTotals.totalIncome) * 100
    : 0;

  const last7Days = getLast7Days();

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={[styles.title, { color: theme.text }]}>Analytics</Text>
        <Text style={[styles.monthLabel, { color: theme.textSecondary }]}>{getMonthLabel()}</Text>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Income</Text>
            <Text style={[styles.summaryAmount, { color: theme.income }]}>
              {formatCurrency(monthlyTotals.totalIncome)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Expense</Text>
            <Text style={[styles.summaryAmount, { color: theme.expense }]}>
              {formatCurrency(monthlyTotals.totalExpense)}
            </Text>
          </View>
        </View>

        {/* Savings Rate */}
        <View style={[styles.savingsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.savingsHeader}>
            <Text style={[styles.savingsTitle, { color: theme.text }]}>Savings Rate</Text>
            <Text style={[styles.savingsPercent, { color: savingsRate >= 0 ? theme.income : theme.expense }]}>
              {savingsRate.toFixed(0)}%
            </Text>
          </View>
          <View style={[styles.savingsBarBg, { backgroundColor: theme.surfaceElevated }]}>
            <View
              style={[
                styles.savingsBarFill,
                {
                  backgroundColor: savingsRate >= 20 ? theme.income : savingsRate >= 0 ? theme.warning : theme.expense,
                  width: `${Math.min(Math.max(savingsRate, 0), 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.savingsHint, { color: theme.textMuted }]}>
            {savingsRate >= 20
              ? '🎉 Great job! You\'re saving well.'
              : savingsRate >= 0
              ? '💡 Try to save at least 20% of your income.'
              : '⚠️ You\'re spending more than you earn.'}
          </Text>
        </View>

        {/* Daily Spending Chart */}
        <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Daily Spending</Text>
          <View style={styles.chart}>
            {last7Days.map((day) => {
              const dayData = dailyData.find((d) => d.day === day.date);
              const expense = dayData?.expense || 0;
              const barHeight = maxDailyExpense > 0 ? (expense / maxDailyExpense) * CHART_HEIGHT : 0;
              return (
                <View key={day.date} style={styles.barColumn}>
                  <Text style={[styles.barValue, { color: theme.textMuted }]}>
                    {expense > 0 ? formatCompact(expense) : ''}
                  </Text>
                  <View style={styles.barContainer}>
                    <View
                      style={[styles.bar, {
                        height: Math.max(barHeight, 4),
                        backgroundColor: theme.primary,
                        borderRadius: 4,
                      }]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: theme.textMuted }]}>{day.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 100 }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Category Breakdown</Text>
          {categoryTotals.length === 0 ? (
            <Text style={[styles.emptyChart, { color: theme.textMuted }]}>
              No spending data yet
            </Text>
          ) : (
            categoryTotals.map((cat) => (
              <View key={cat.categoryId} style={styles.catRow}>
                <View style={styles.catInfo}>
                  <View style={[styles.catDot, { backgroundColor: cat.categoryColor }]} />
                  <Text style={[styles.catName, { color: theme.text }]}>{cat.categoryName}</Text>
                </View>
                <View style={styles.catBarContainer}>
                  <View
                    style={[styles.catBar, {
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.categoryColor,
                    }]}
                  />
                </View>
                <Text style={[styles.catAmount, { color: theme.textSecondary }]}>
                  {formatCurrency(cat.total)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  title: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.xl, marginBottom: 4 },
  monthLabel: { fontFamily: typography.fontFamily.regular, fontSize: typography.sizes.sm, marginBottom: 20 },

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: {
    flex: 1, padding: 16, borderRadius: borderRadius.lg, borderWidth: 1,
  },
  summaryLabel: { fontFamily: typography.fontFamily.regular, fontSize: typography.sizes.xs, marginBottom: 6 },
  summaryAmount: { fontFamily: typography.fontFamily.mono, fontSize: typography.sizes.lg },

  savingsCard: { padding: 20, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: 16 },
  savingsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  savingsTitle: { fontFamily: typography.fontFamily.semibold, fontSize: typography.sizes.base },
  savingsPercent: { fontFamily: typography.fontFamily.monoBold, fontSize: typography.sizes.xl },
  savingsBarBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  savingsBarFill: { height: '100%', borderRadius: 4 },
  savingsHint: { fontFamily: typography.fontFamily.regular, fontSize: typography.sizes.sm },

  chartCard: { padding: 20, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: 16 },
  chartTitle: { fontFamily: typography.fontFamily.semibold, fontSize: typography.sizes.base, marginBottom: 20 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: CHART_HEIGHT + 40 },
  barColumn: { alignItems: 'center', flex: 1 },
  barValue: { fontFamily: typography.fontFamily.mono, fontSize: 9, marginBottom: 6, height: 14 },
  barContainer: { height: CHART_HEIGHT, justifyContent: 'flex-end' },
  bar: { width: BAR_WIDTH },
  barLabel: { fontFamily: typography.fontFamily.regular, fontSize: 11, marginTop: 8 },

  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  catInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 110 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catName: { fontFamily: typography.fontFamily.medium, fontSize: typography.sizes.sm, flex: 1 },
  catBarContainer: {
    flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden',
  },
  catBar: { height: '100%', borderRadius: 4 },
  catAmount: { fontFamily: typography.fontFamily.mono, fontSize: typography.sizes.sm, width: 70, textAlign: 'right' },
  emptyChart: { fontFamily: typography.fontFamily.regular, fontSize: typography.sizes.sm, textAlign: 'center', paddingVertical: 20 },
});
