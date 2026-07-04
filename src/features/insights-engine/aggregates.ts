import { Account, Category, Transaction } from '@/types';
import {
  BuildInsightsSnapshotInput,
  InsightAccountSummaryRow,
  InsightCategoryBreakdownRow,
  InsightHabitSummary,
  InsightPeriodTotal,
  InsightRiskSummary,
  InsightSpendingPatternRow,
  InsightTrend,
  InsightTrendPoint,
  InsightsSnapshot,
  InsightsScreenSections,
  SubscriptionCandidate,
  UnusualSpendCandidate,
} from './types';

function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function startOfWeek(date: Date): Date {
  const value = startOfDay(date);
  const day = value.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + mondayOffset);
  return value;
}

function endOfWeek(date: Date): Date {
  const value = startOfWeek(date);
  value.setDate(value.getDate() + 6);
  value.setHours(23, 59, 59, 999);
  return value;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function toDateOnly(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[midpoint - 1] + sorted[midpoint]) / 2
    : sorted[midpoint];
}

function normalizeMerchant(merchant: string | null): string {
  if (!merchant) return '';
  return merchant.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getCategoryMeta(categoryId: string | null, categories: Category[]) {
  const category = categories.find((item) => item.id === categoryId);
  return {
    categoryName: category?.name ?? 'Other',
    categoryIcon: category?.icon ?? 'circle-help',
    categoryColor: category?.color ?? '#8B949E',
  };
}

function getCategoryName(categoryId: string | null, categories: Category[]): string {
  return getCategoryMeta(categoryId, categories).categoryName;
}

function getTopMerchantsForCategory(
  transactions: Transaction[],
  categories: Category[],
  categoryName: string
): string[] {
  const merchantTotals = new Map<string, number>();

  for (const transaction of transactions) {
    const transactionCategory = getCategoryName(transaction.categoryId, categories);
    if (transactionCategory !== categoryName) continue;
    const merchant = transaction.merchant || transaction.description || 'General Spends';
    merchantTotals.set(merchant, (merchantTotals.get(merchant) ?? 0) + transaction.amount);
  }

  const merchants = [...merchantTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([merchant]) => merchant);

  if (merchants.length === 0) {
    return ['No transactions detected', 'Stable baseline'];
  }

  while (merchants.length < 2) {
    merchants.push('Other Outlets');
  }

  return merchants;
}

export function filterTransactionsInRange(
  transactions: Transaction[],
  dateFrom: Date,
  dateTo: Date
): Transaction[] {
  const from = dateFrom.getTime();
  const to = dateTo.getTime();
  return transactions.filter((transaction) => {
    const value = new Date(transaction.date).getTime();
    return value >= from && value <= to;
  });
}

export function summarizePeriod(
  label: InsightPeriodTotal['label'],
  transactions: Transaction[],
  dateFrom: Date,
  dateTo: Date
): InsightPeriodTotal {
  const inRange = filterTransactionsInRange(transactions, dateFrom, dateTo);
  const expenseTotal = inRange
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const incomeTotal = inRange
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    label,
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
    expenseTotal: roundCurrency(expenseTotal),
    incomeTotal: roundCurrency(incomeTotal),
    transactionCount: inRange.length,
  };
}

export function buildTrend(currentTotal: number, previousTotal: number, period: 'weekly' | 'monthly'): InsightTrend {
  const deltaAmount = roundCurrency(currentTotal - previousTotal);
  const deltaPercentage = previousTotal === 0
    ? (currentTotal === 0 ? 0 : 100)
    : roundCurrency((deltaAmount / previousTotal) * 100);
  return {
    period,
    currentTotal: roundCurrency(currentTotal),
    previousTotal: roundCurrency(previousTotal),
    deltaAmount,
    deltaPercentage,
    direction: deltaAmount > 0 ? 'up' : deltaAmount < 0 ? 'down' : 'flat',
  };
}

export function buildCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[]
): InsightCategoryBreakdownRow[] {
  const expenses = transactions.filter((transaction) => transaction.type === 'expense');
  const totals = new Map<string | null, { total: number; transactionCount: number }>();

  for (const transaction of expenses) {
    const current = totals.get(transaction.categoryId) ?? { total: 0, transactionCount: 0 };
    current.total += transaction.amount;
    current.transactionCount += 1;
    totals.set(transaction.categoryId, current);
  }

  const overallTotal = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);

  return [...totals.entries()]
    .map(([categoryId, row]) => {
      const meta = getCategoryMeta(categoryId, categories);
      return {
        categoryId,
        categoryName: meta.categoryName,
        categoryIcon: meta.categoryIcon,
        categoryColor: meta.categoryColor,
        total: roundCurrency(row.total),
        transactionCount: row.transactionCount,
        percentage: overallTotal === 0 ? 0 : roundCurrency((row.total / overallTotal) * 100),
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function buildAccountSummaries(
  transactions: Transaction[],
  accounts: Account[]
): InsightAccountSummaryRow[] {
  return accounts
    .map((account) => {
      const rows = transactions.filter((transaction) => transaction.accountId === account.id);
      const expenseTotal = rows
        .filter((transaction) => transaction.type === 'expense')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const incomeTotal = rows
        .filter((transaction) => transaction.type === 'income')
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      return {
        accountId: account.id,
        accountName: account.name,
        accountType: account.type,
        expenseTotal: roundCurrency(expenseTotal),
        incomeTotal: roundCurrency(incomeTotal),
        netAmount: roundCurrency(incomeTotal - expenseTotal),
        transactionCount: rows.length,
      };
    })
    .filter((row) => row.transactionCount > 0)
    .sort((a, b) => b.expenseTotal - a.expenseTotal);
}

export function buildDailyTrendPoints(
  transactions: Transaction[],
  days: number,
  now: Date = new Date()
): InsightTrendPoint[] {
  const points: InsightTrendPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const rows = filterTransactionsInRange(transactions, dayStart, dayEnd);

    points.push({
      label: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
      date: toDateOnly(dayStart.toISOString()),
      expenseTotal: roundCurrency(
        rows.filter((transaction) => transaction.type === 'expense').reduce((sum, transaction) => sum + transaction.amount, 0)
      ),
      incomeTotal: roundCurrency(
        rows.filter((transaction) => transaction.type === 'income').reduce((sum, transaction) => sum + transaction.amount, 0)
      ),
    });
  }

  return points;
}

export function buildSpendingPatternsSection(
  currentMonthTransactions: Transaction[],
  previousMonthTransactions: Transaction[],
  categories: Category[]
): InsightSpendingPatternRow[] {
  const currentBreakdown = buildCategoryBreakdown(currentMonthTransactions, categories);
  const previousBreakdown = buildCategoryBreakdown(previousMonthTransactions, categories);
  const previousTotals = new Map(previousBreakdown.map((row) => [row.categoryName, row.total]));

  const patterns = currentBreakdown.slice(0, 2).map((row) => {
    const previousAmount = previousTotals.get(row.categoryName) ?? 0;
    const amountChange = Math.round(row.total - previousAmount);
    let direction: InsightSpendingPatternRow['direction'] = 'neutral';
    let percentChange = 0;

    if (previousAmount > 0) {
      const delta = ((row.total - previousAmount) / previousAmount) * 100;
      direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';
      percentChange = Math.round(Math.abs(delta));
    } else if (row.total > 0) {
      direction = 'up';
      percentChange = 100;
    }

    let positiveInsight: string | null = null;
    if (direction === 'down') {
      positiveInsight = `Excellent discipline! You saved ₹${Math.abs(amountChange).toLocaleString('en-IN')} this month by trimming spends in ${row.categoryName}.`;
    }

    return {
      categoryName: row.categoryName,
      amount: Math.round(row.total),
      previousAmount: Math.round(previousAmount),
      amountChange,
      percentChange,
      direction,
      topMerchants: getTopMerchantsForCategory(currentMonthTransactions, categories, row.categoryName),
      positiveInsight,
    };
  });

  return patterns;
}

export function buildHabitsSection(
  currentMonthExpenses: Transaction[],
  categories: Category[]
): InsightHabitSummary[] {
  if (currentMonthExpenses.length === 0) {
    return [];
  }

  const totalExpense = currentMonthExpenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  let weekendSpend = 0;
  let foodSpend = 0;
  let eveningCount = 0;

  for (const transaction of currentMonthExpenses) {
    const date = new Date(transaction.date);
    const day = date.getDay();
    const hour = date.getHours();
    const categoryName = getCategoryName(transaction.categoryId, categories).toLowerCase();

    if (day === 0 || day === 6) {
      weekendSpend += transaction.amount;
    }

    if (
      categoryName.includes('food') ||
      categoryName.includes('dining') ||
      categoryName.includes('eat') ||
      categoryName.includes('restaurant')
    ) {
      foodSpend += transaction.amount;
    }

    if (hour >= 17 && hour < 23) {
      eveningCount += 1;
    }
  }

  const weekendPct = totalExpense > 0 ? (weekendSpend / totalExpense) * 100 : 0;
  const foodPct = totalExpense > 0 ? (foodSpend / totalExpense) * 100 : 0;
  const eveningPct = currentMonthExpenses.length > 0 ? (eveningCount / currentMonthExpenses.length) * 100 : 0;

  const habits: InsightHabitSummary[] = [
    weekendPct > 35
      ? {
          key: 'weekend-balance',
          title: 'Weekend Concentration',
          summary: 'Most spending occurs on weekends',
          detail: 'Your spending is clustered on weekends. A dedicated weekend allowance can reduce lifestyle creep.',
          tone: 'neutral',
          icon: 'calendar',
        }
      : {
          key: 'weekend-balance',
          title: 'Balanced Timeline',
          summary: 'Weekday spending patterns remain steady and balanced',
          detail: 'Your weekday and weekend spending are fairly balanced, which supports more predictable monthly cash flow.',
          tone: 'positive',
          icon: 'calendar',
        },
    {
      key: 'food-share',
      title: 'Dining & Food Ratio',
      summary: `Food accounts for ${Math.round(foodPct)}% of expenses`,
      detail: 'Food and dining are taking a visible share of your recent outgoings. Meal planning or batching orders can reduce drift.',
      tone: foodPct > 35 ? 'neutral' : 'positive',
      icon: 'percent',
    },
    eveningPct > 40
      ? {
          key: 'time-distribution',
          title: 'Evening Spend Peaks',
          summary: 'Transactions increase during evenings',
          detail: 'Your spending peaks later in the day, which can be a signal for convenience or fatigue-driven purchases.',
          tone: 'neutral',
          icon: 'clock',
        }
      : {
          key: 'time-distribution',
          title: 'Even Time Distribution',
          summary: 'Transactions are evenly distributed throughout the day',
          detail: 'No strong time-of-day spike is visible in your current-month transaction pattern.',
          tone: 'positive',
          icon: 'clock',
        },
  ];

  return habits;
}

export function buildRiskSection(
  monthlyTrend: InsightTrend,
  unusualSpendCandidates: UnusualSpendCandidate[],
  subscriptionCandidates: SubscriptionCandidate[],
  spendingPatterns: InsightSpendingPatternRow[]
): InsightRiskSummary {
  const checklist: string[] = [];

  if (unusualSpendCandidates[0]) {
    checklist.push(`${unusualSpendCandidates[0].categoryName} spending broke its normal baseline`);
  }

  if (monthlyTrend.direction === 'up' && monthlyTrend.deltaPercentage >= 15) {
    checklist.push(`Monthly spending is up ${Math.round(monthlyTrend.deltaPercentage)}% versus last month`);
  }

  if (subscriptionCandidates[0]) {
    checklist.push(`Recurring charge candidate detected at ${subscriptionCandidates[0].merchant}`);
  }

  const risingPattern = spendingPatterns.find((pattern) => pattern.direction === 'up');
  if (risingPattern && checklist.length < 3) {
    checklist.push(`${risingPattern.categoryName} is one of your fastest-rising categories this month`);
  }

  let level: InsightRiskSummary['level'] = 'Low';
  if (checklist.length >= 3 || (unusualSpendCandidates[0]?.multiplier ?? 0) >= 3) {
    level = 'High';
  } else if (checklist.length > 0) {
    level = 'Medium';
  }

  if (checklist.length === 0) {
    checklist.push('I detected no abnormal spending');
    checklist.push('I found no suspicious spikes');
    checklist.push('I detected no spending anomalies');
  }

  while (checklist.length < 3) {
    checklist.push('I detected no additional risk signals');
  }

  return {
    level,
    description:
      level === 'Low'
        ? 'Your recent activity appears consistent with your normal behavior.'
        : 'I detected patterns that are moving above your typical spending baseline.',
    checklist: checklist.slice(0, 3),
  };
}

export function buildObservationsSection(
  currentMonthExpenses: Transaction[],
  previousMonthExpenses: Transaction[]
): string[] {
  if (currentMonthExpenses.length === 0) {
    return [
      'You spend ₹0 less on weekdays',
      'Cash usage is steady compared to last month',
      'Average transaction value is ₹0',
    ];
  }

  let weekdaySum = 0;
  const weekdayDays = new Set<string>();
  let weekendSum = 0;
  const weekendDays = new Set<string>();

  for (const transaction of currentMonthExpenses) {
    const date = new Date(transaction.date);
    const day = date.getDay();
    const dateKey = toDateOnly(transaction.date);

    if (day === 0 || day === 6) {
      weekendSum += transaction.amount;
      weekendDays.add(dateKey);
    } else {
      weekdaySum += transaction.amount;
      weekdayDays.add(dateKey);
    }
  }

  const avgWeekday = weekdayDays.size > 0 ? weekdaySum / weekdayDays.size : 0;
  const avgWeekend = weekendDays.size > 0 ? weekendSum / weekendDays.size : 0;

  const currentMonthTotal = currentMonthExpenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  const previousMonthTotal = previousMonthExpenses.reduce((sum, transaction) => sum + transaction.amount, 0);

  const currentCash = currentMonthExpenses
    .filter((transaction) =>
      (transaction.description || '').toLowerCase().includes('cash') ||
      (transaction.merchant || '').toLowerCase().includes('atm')
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const previousCash = previousMonthExpenses
    .filter((transaction) =>
      (transaction.description || '').toLowerCase().includes('cash') ||
      (transaction.merchant || '').toLowerCase().includes('atm')
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const currentCashRatio = currentMonthTotal > 0 ? currentCash / currentMonthTotal : 0;
  const previousCashRatio = previousMonthTotal > 0 ? previousCash / previousMonthTotal : 0;

  const avgTransactionValue = currentMonthExpenses.length > 0 ? currentMonthTotal / currentMonthExpenses.length : 0;

  return [
    avgWeekend > avgWeekday
      ? `You spend ₹${Math.round(avgWeekend - avgWeekday)} less on weekdays`
      : `You spend ₹${Math.round(avgWeekday - avgWeekend)} less on weekends`,
    previousCashRatio > currentCashRatio
      ? `Cash usage is ${Math.round((previousCashRatio - currentCashRatio) * 100)}% lower than last month`
      : currentCashRatio > previousCashRatio
      ? `Cash usage is ${Math.round((currentCashRatio - previousCashRatio) * 100)}% higher than last month`
      : 'Cash usage is steady compared to last month',
    `Average transaction value is ₹${Math.round(avgTransactionValue)}`,
  ];
}

export function buildCoachTipSection(
  spendingPatterns: InsightSpendingPatternRow[],
  unusualSpendCandidates: UnusualSpendCandidate[],
  monthlyTrend: InsightTrend
): string {
  const topUnusual = unusualSpendCandidates[0];
  if (topUnusual) {
    const recoverableAmount = Math.max(0, Math.round(topUnusual.amount - topUnusual.baselineMedian));
    return `Bringing your ${topUnusual.categoryName} spend back to its usual range would recover about ₹${recoverableAmount.toLocaleString('en-IN')} on similar purchases.`;
  }

  const risingPattern = spendingPatterns.find((pattern) => pattern.direction === 'up');
  if (risingPattern) {
    const savings = Math.round(risingPattern.amount * 0.1);
    return `Saving just 10% on ${risingPattern.categoryName} this month translates to ₹${savings.toLocaleString('en-IN')} extra saved.`;
  }

  if (monthlyTrend.direction === 'up' && monthlyTrend.deltaAmount > 0) {
    return `Matching last month's pace would keep about ₹${Math.round(monthlyTrend.deltaAmount).toLocaleString('en-IN')} in your cushion this month.`;
  }

  return 'Saving ₹50 daily becomes ₹18,250 yearly. Keep logging transactions to get sharper coach guidance.';
}

export function detectUnusualSpendCandidates(
  transactions: Transaction[],
  categories: Category[]
): UnusualSpendCandidate[] {
  const expenses = [...transactions]
    .filter((transaction) => transaction.type === 'expense')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const candidates: UnusualSpendCandidate[] = [];

  for (let index = 0; index < expenses.length; index += 1) {
    const transaction = expenses[index];
    const earlier = expenses.slice(0, index);
    const categoryComparable = earlier.filter((item) => item.categoryId === transaction.categoryId);
    const merchantComparable = earlier.filter(
      (item) => normalizeMerchant(item.merchant) !== '' &&
        normalizeMerchant(item.merchant) === normalizeMerchant(transaction.merchant)
    );

    let baseline: number[] = [];
    let reason = '';

    if (merchantComparable.length >= 3) {
      baseline = merchantComparable.map((item) => item.amount);
      reason = 'Amount is materially above your recent merchant baseline.';
    } else if (categoryComparable.length >= 3) {
      baseline = categoryComparable.map((item) => item.amount);
      reason = 'Amount is materially above your recent category baseline.';
    }

    if (baseline.length < 3) continue;

    const baselineMedian = median(baseline);
    if (baselineMedian <= 0) continue;

    const multiplier = transaction.amount / baselineMedian;
    if (multiplier < 1.75) continue;

    const meta = getCategoryMeta(transaction.categoryId, categories);
    candidates.push({
      transactionId: transaction.id,
      merchant: transaction.merchant,
      categoryId: transaction.categoryId,
      categoryName: meta.categoryName,
      amount: roundCurrency(transaction.amount),
      baselineMedian: roundCurrency(baselineMedian),
      multiplier: roundCurrency(multiplier),
      date: transaction.date,
      reason,
    });
  }

  return candidates.sort((a, b) => b.multiplier - a.multiplier).slice(0, 5);
}

export function detectSubscriptionCandidates(transactions: Transaction[]): SubscriptionCandidate[] {
  const expenses = [...transactions]
    .filter((transaction) => transaction.type === 'expense' && normalizeMerchant(transaction.merchant) !== '')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const groups = new Map<string, Transaction[]>();
  for (const transaction of expenses) {
    const normalizedMerchant = normalizeMerchant(transaction.merchant);
    const amountBand = Math.round(transaction.amount / 10) * 10;
    const key = `${normalizedMerchant}::${amountBand}`;
    const rows = groups.get(key) ?? [];
    rows.push(transaction);
    groups.set(key, rows);
  }

  const candidates: SubscriptionCandidate[] = [];
  for (const [key, rows] of groups.entries()) {
    if (rows.length < 2) continue;

    const sorted = [...rows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const intervals: number[] = [];
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = new Date(sorted[index - 1].date).getTime();
      const current = new Date(sorted[index].date).getTime();
      intervals.push(Math.round((current - previous) / (1000 * 60 * 60 * 24)));
    }

    const cadenceDays = roundCurrency(intervals.reduce((sum, value) => sum + value, 0) / intervals.length);
    if (cadenceDays < 25 || cadenceDays > 35) continue;

    const [normalizedMerchant, amountBandRaw] = key.split('::');
    const averageAmount = rows.reduce((sum, row) => sum + row.amount, 0) / rows.length;
    const merchant = sorted[sorted.length - 1].merchant ?? normalizedMerchant;

    candidates.push({
      merchant,
      normalizedMerchant,
      amountBand: Number(amountBandRaw),
      occurrenceCount: rows.length,
      averageAmount: roundCurrency(averageAmount),
      cadenceDays,
      lastChargedAt: sorted[sorted.length - 1].date,
      transactionIds: sorted.map((row) => row.id),
      confidence: rows.length >= 3 ? 'high' : 'medium',
    });
  }

  return candidates.sort((a, b) => b.occurrenceCount - a.occurrenceCount);
}

export function buildInsightsSnapshot(input: BuildInsightsSnapshotInput): InsightsSnapshot {
  const { transactions, categories, accounts, now = new Date() } = input;
  const dailyStart = startOfDay(now);
  const dailyEnd = endOfDay(now);
  const weeklyStart = startOfWeek(now);
  const weeklyEnd = endOfWeek(now);
  const monthlyStart = startOfMonth(now);
  const monthlyEnd = endOfMonth(now);

  const previousWeeklyEnd = new Date(weeklyStart.getTime() - 1);
  const previousWeeklyStart = startOfWeek(previousWeeklyEnd);
  const previousMonthlyEnd = new Date(monthlyStart.getTime() - 1);
  const previousMonthlyStart = startOfMonth(previousMonthlyEnd);

  const periods = {
    daily: summarizePeriod('daily', transactions, dailyStart, dailyEnd),
    weekly: summarizePeriod('weekly', transactions, weeklyStart, weeklyEnd),
    monthly: summarizePeriod('monthly', transactions, monthlyStart, monthlyEnd),
  };

  const previousWeek = summarizePeriod('weekly', transactions, previousWeeklyStart, endOfWeek(previousWeeklyEnd));
  const previousMonth = summarizePeriod('monthly', transactions, previousMonthlyStart, endOfMonth(previousMonthlyEnd));
  const currentMonthTransactions = filterTransactionsInRange(transactions, monthlyStart, monthlyEnd);
  const previousMonthTransactions = filterTransactionsInRange(transactions, previousMonthlyStart, previousMonthlyEnd);
  const currentMonthExpenses = currentMonthTransactions.filter((transaction) => transaction.type === 'expense');
  const previousMonthExpenses = previousMonthTransactions.filter((transaction) => transaction.type === 'expense');
  const unusualSpendCandidates = detectUnusualSpendCandidates(filterTransactionsInRange(transactions, previousMonthlyStart, monthlyEnd), categories);
  const subscriptionCandidates = detectSubscriptionCandidates(filterTransactionsInRange(transactions, previousMonthlyStart, monthlyEnd));
  const spendingPatterns = buildSpendingPatternsSection(currentMonthTransactions, previousMonthTransactions, categories);
  const sections: InsightsScreenSections = {
    spendingPatterns,
    habits: buildHabitsSection(currentMonthExpenses, categories),
    risk: buildRiskSection(
      buildTrend(periods.monthly.expenseTotal, previousMonth.expenseTotal, 'monthly'),
      unusualSpendCandidates,
      subscriptionCandidates,
      spendingPatterns
    ),
    observations: buildObservationsSection(currentMonthExpenses, previousMonthExpenses),
    coachTip: buildCoachTipSection(
      spendingPatterns,
      unusualSpendCandidates,
      buildTrend(periods.monthly.expenseTotal, previousMonth.expenseTotal, 'monthly')
    ),
  };

  const sourceSummary: InsightsSnapshot['sourceSummary'] = { sms: 0, email: 0, manual: 0 };
  for (const transaction of transactions) {
    sourceSummary[transaction.source] += 1;
  }

  return {
    generatedAt: now.toISOString(),
    transactionCount: transactions.length,
    duplicateSafeTransactionCount: transactions.length,
    periods,
    trends: {
      weekly: buildTrend(periods.weekly.expenseTotal, previousWeek.expenseTotal, 'weekly'),
      monthly: buildTrend(periods.monthly.expenseTotal, previousMonth.expenseTotal, 'monthly'),
    },
    categoryBreakdown: buildCategoryBreakdown(filterTransactionsInRange(transactions, monthlyStart, monthlyEnd), categories),
    accountSummaries: buildAccountSummaries(filterTransactionsInRange(transactions, monthlyStart, monthlyEnd), accounts),
    dailyTrendPoints: buildDailyTrendPoints(transactions, 7, now),
    unusualSpendCandidates,
    subscriptionCandidates,
    sections,
    sourceSummary,
  };
}
