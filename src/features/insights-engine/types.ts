import { Account, Category, Transaction } from '@/types';

export interface InsightPeriodTotal {
  label: 'daily' | 'weekly' | 'monthly';
  dateFrom: string;
  dateTo: string;
  expenseTotal: number;
  incomeTotal: number;
  transactionCount: number;
}

export interface InsightTrend {
  period: 'weekly' | 'monthly';
  currentTotal: number;
  previousTotal: number;
  deltaAmount: number;
  deltaPercentage: number;
  direction: 'up' | 'down' | 'flat';
}

export interface InsightCategoryBreakdownRow {
  categoryId: string | null;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  transactionCount: number;
  percentage: number;
}

export interface InsightAccountSummaryRow {
  accountId: string;
  accountName: string;
  accountType: Account['type'];
  expenseTotal: number;
  incomeTotal: number;
  netAmount: number;
  transactionCount: number;
}

export interface InsightTrendPoint {
  label: string;
  date: string;
  expenseTotal: number;
  incomeTotal: number;
}

export interface UnusualSpendCandidate {
  transactionId: string;
  merchant: string | null;
  categoryId: string | null;
  categoryName: string;
  amount: number;
  baselineMedian: number;
  multiplier: number;
  date: string;
  reason: string;
}

export interface SubscriptionCandidate {
  merchant: string;
  normalizedMerchant: string;
  amountBand: number;
  occurrenceCount: number;
  averageAmount: number;
  cadenceDays: number;
  lastChargedAt: string;
  transactionIds: string[];
  confidence: 'medium' | 'high';
}

export type InsightPatternDirection = 'up' | 'down' | 'neutral';

export interface InsightSpendingPatternRow {
  categoryName: string;
  amount: number;
  previousAmount: number;
  amountChange: number;
  percentChange: number;
  direction: InsightPatternDirection;
  topMerchants: string[];
  positiveInsight: string | null;
}

export type InsightHabitTone = 'positive' | 'neutral';
export type InsightHabitIcon = 'calendar' | 'percent' | 'clock';

export interface InsightHabitSummary {
  key: 'weekend-balance' | 'food-share' | 'time-distribution' | 'cash-usage';
  title: string;
  summary: string;
  detail: string;
  tone: InsightHabitTone;
  icon: InsightHabitIcon;
}

export interface InsightRiskSummary {
  level: 'Low' | 'Medium' | 'High';
  description: string;
  checklist: string[];
}

export interface InsightsScreenSections {
  spendingPatterns: InsightSpendingPatternRow[];
  habits: InsightHabitSummary[];
  risk: InsightRiskSummary;
  observations: string[];
  coachTip: string;
}

export interface InsightsSnapshot {
  generatedAt: string;
  transactionCount: number;
  duplicateSafeTransactionCount: number;
  periods: {
    daily: InsightPeriodTotal;
    weekly: InsightPeriodTotal;
    monthly: InsightPeriodTotal;
  };
  trends: {
    weekly: InsightTrend;
    monthly: InsightTrend;
  };
  categoryBreakdown: InsightCategoryBreakdownRow[];
  accountSummaries: InsightAccountSummaryRow[];
  dailyTrendPoints: InsightTrendPoint[];
  unusualSpendCandidates: UnusualSpendCandidate[];
  subscriptionCandidates: SubscriptionCandidate[];
  sections: InsightsScreenSections;
  sourceSummary: Record<Transaction['source'], number>;
}

export interface BuildInsightsSnapshotInput {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  now?: Date;
}
