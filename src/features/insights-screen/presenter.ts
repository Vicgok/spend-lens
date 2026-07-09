import { Category, Transaction } from '@/types';
import { InsightsSnapshot } from '@/features/insights-engine/types';
import { generateAllInsights } from '@/features/insights-engine/detector';
import {
  buildDefaultInsightsScreenSectionsDisplay,
  mapInsightsSnapshotToScreenSections,
} from '@/features/insights-engine/presenter';
import {
  calculateSalarySurvivalScore,
  calculateSalarySurvivalScoreFromSnapshot,
} from '@/features/insights-engine/formulas';

const EXPENSE_TREND_DAYS = 14;

export interface ExpenseTrendPoint {
  key: string;
  date: Date;
  amount: number;
  shortDay: string;
  shortDate: string;
  x: number;
  y: number;
}

export interface ExpenseTrendModel {
  points: ExpenseTrendPoint[];
  maxAmount: number;
  totalAmount: number;
  activeDays: number;
  averageAmount: number;
  peakPoint: ExpenseTrendPoint | null;
  latestPoint: ExpenseTrendPoint | null;
  defaultPoint: ExpenseTrendPoint | null;
  chartHeight: number;
  chartWidth: number;
  bottomPadding: number;
  linePath: string;
  areaPath: string;
}

export function buildInsightsScreenData(input: {
  transactions: Transaction[];
  tempTransactions: Transaction[] | null;
  categories: Category[];
  insightsSnapshot: InsightsSnapshot | null;
  currentBalance: number;
}) {
  const activeTransactions = input.tempTransactions || input.transactions;
  const survivalScore = input.insightsSnapshot
    ? calculateSalarySurvivalScoreFromSnapshot(input.insightsSnapshot)
    : calculateSalarySurvivalScore(activeTransactions);

  return {
    activeTransactions,
    survivalScore,
    detectedInsights: generateAllInsights(
      activeTransactions,
      input.categories,
      input.currentBalance
    ),
    snapshotSections: input.insightsSnapshot
      ? mapInsightsSnapshotToScreenSections(input.insightsSnapshot)
      : buildDefaultInsightsScreenSectionsDisplay(),
    scoreStatus: buildInsightsScoreStatus(survivalScore),
    expenseTrend: buildExpenseTrend(activeTransactions),
  };
}

export function buildInsightsScoreStatus(survivalScore: number) {
  if (survivalScore >= 90) {
    return {
      label: 'Excellent',
      text: 'Your spending looks stable and I detected no unusual activity this week.',
    };
  }
  if (survivalScore >= 70) {
    return {
      label: 'Healthy',
      text: 'Your financial cushion looks healthy, keep supporting your key saving goals.',
    };
  }
  if (survivalScore >= 50) {
    return {
      label: 'Watch Closely',
      text: 'Discretionary spending is rising, check your recent transaction spikes.',
    };
  }
  return {
    label: 'Needs Attention',
    text: 'High expenditure rate detected. Consider slowing down non-essential spend immediately.',
  };
}

export function buildExpenseTrend(
  transactions: Transaction[]
): ExpenseTrendModel {
  const expenses = transactions.filter(
    (transaction) => transaction.type === 'expense'
  );
  const totalsByDay = new Map<string, number>();

  expenses.forEach((transaction) => {
    const key = getLocalDateKey(transaction.date);
    totalsByDay.set(key, (totalsByDay.get(key) || 0) + transaction.amount);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const points = Array.from({ length: EXPENSE_TREND_DAYS }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (EXPENSE_TREND_DAYS - 1 - index));
    const key = getLocalDateKey(date);
    return {
      key,
      date,
      amount: Math.round(totalsByDay.get(key) || 0),
      shortDay: formatShortDay(date),
      shortDate: formatShortMonthDay(date),
    };
  });

  const maxAmount = Math.max(...points.map((point) => point.amount), 0);
  const totalAmount = points.reduce((sum, point) => sum + point.amount, 0);
  const activeDays = points.filter((point) => point.amount > 0).length;
  const averageAmount = activeDays > 0 ? Math.round(totalAmount / activeDays) : 0;
  const chartHeight = 214;
  const chartWidth = 320;
  const leftPadding = 12;
  const rightPadding = 12;
  const topPadding = 18;
  const bottomPadding = 24;
  const usableWidth = chartWidth - leftPadding - rightPadding;
  const usableHeight = chartHeight - topPadding - bottomPadding;

  const plottedPoints: ExpenseTrendPoint[] = points.map((point, index) => {
    const x = leftPadding + (usableWidth * index) / Math.max(points.length - 1, 1);
    const normalized = maxAmount > 0 ? point.amount / maxAmount : 0;
    const y = topPadding + usableHeight - normalized * usableHeight;
    return {
      ...point,
      x,
      y,
    };
  });

  const linePath = plottedPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const areaPath = plottedPoints.length
    ? `${linePath} L ${plottedPoints[plottedPoints.length - 1].x} ${chartHeight - bottomPadding} L ${plottedPoints[0].x} ${chartHeight - bottomPadding} Z`
    : '';
  const peakPoint = plottedPoints.reduce<ExpenseTrendPoint | null>(
    (peak, point) => {
      if (!peak || point.amount > peak.amount) {
        return point;
      }
      return peak;
    },
    null
  );
  const latestPoint = plottedPoints[plottedPoints.length - 1] || null;
  const defaultPoint =
    [...plottedPoints].reverse().find((point) => point.amount > 0) ||
    latestPoint;

  return {
    points: plottedPoints,
    maxAmount,
    totalAmount,
    activeDays,
    averageAmount,
    peakPoint,
    latestPoint,
    defaultPoint,
    chartHeight,
    chartWidth,
    bottomPadding,
    linePath,
    areaPath,
  };
}

export function buildExpenseTrendChartData(expenseTrend: ExpenseTrendModel) {
  return expenseTrend.points.map((point) => ({
    key: point.key,
    label: point.shortDay,
    value: point.amount,
  }));
}

function getLocalDateKey(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
}

function formatShortDay(date: Date): string {
  return date.toLocaleDateString('en-IN', { weekday: 'short' });
}

function formatShortMonthDay(date: Date): string {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
