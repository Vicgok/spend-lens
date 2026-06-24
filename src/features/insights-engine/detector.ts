import { Transaction, Category } from '../../types';
import { InsightsTransaction, SubscriptionCandidate, UnusualSpendCandidate } from './types';
import { filterDuplicateTransactions } from './normalization';

export interface InsightCardData {
  id: string;
  type:
    | 'money_leak'
    | 'subscription'
    | 'unusual_spend'
    | 'weekend_overspend'
    | 'food_inflation'
    | 'shopping_increase'
    | 'salary_risk'
    | 'month_end_prediction'
    | 'impulse_spending';
  title: string;
  subtitle: string;
  metric?: string;
  impactAmount?: number;
  whatHappened: string;
  why: string;
  whatToDo: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Detects potential impulse spending (multiple transactions at the same merchant
 * within a 4-hour window on the same day).
 */
export function detectImpulseSpending(transactions: Transaction[]): InsightCardData[] {
  const expenseTxs = transactions.filter((t) => t.type === 'expense' && t.merchant);
  if (expenseTxs.length < 2) return [];

  // Sort chronologically
  const sorted = [...expenseTxs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const impulseGroups: { merchant: string; amount: number; txs: Transaction[] }[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const txA = sorted[i];
    const group = [txA];
    const timeA = new Date(txA.date).getTime();

    for (let j = i + 1; j < sorted.length; j++) {
      const txB = sorted[j];
      const timeB = new Date(txB.date).getTime();

      // Within 4 hours (14,400,000 ms) and same merchant
      if (
        txB.merchant?.toLowerCase() === txA.merchant?.toLowerCase() &&
        timeB - timeA < 4 * 60 * 60 * 1000
      ) {
        group.push(txB);
      }
    }

    if (group.length >= 2) {
      const totalAmount = group.reduce((sum, t) => sum + t.amount, 0);
      const merchant = txA.merchant || 'Unknown Merchant';

      // Check if we already registered this group or sub-group
      const alreadyAdded = impulseGroups.some((g) =>
        g.txs.some((tx) => group.some((gtx) => gtx.id === tx.id))
      );

      if (!alreadyAdded) {
        impulseGroups.push({ merchant, amount: totalAmount, txs: group });
      }
      // Skip ahead
      i += group.length - 1;
    }
  }

  return impulseGroups.map((g, idx) => ({
    id: `impulse-${idx}`,
    type: 'impulse_spending',
    title: 'Possible Impulse Activity',
    subtitle: `Multiple transactions at ${g.merchant}`,
    metric: `${g.txs.length} purchases`,
    impactAmount: g.amount,
    whatHappened: `You made ${g.txs.length} separate purchases at ${g.merchant} in a short time window on the same day.`,
    why: `Sub-transaction shopping patterns often bypass budget friction and lead to sudden spending spikes.`,
    whatToDo: `Consider implementing a 24-hour cooling-off rule for non-essential purchases at ${g.merchant}.`,
    priority: g.amount > 2000 ? 'high' : 'medium',
  }));
}

/**
 * Detects weekend overspending compared to weekday spending averages.
 */
export function detectWeekendOverspend(transactions: Transaction[]): InsightCardData[] {
  const expenses = transactions.filter((t) => t.type === 'expense');
  if (expenses.length < 5) return [];

  let weekdaySum = 0;
  let weekdayDays = new Set<string>();
  let weekendSum = 0;
  let weekendDays = new Set<string>();

  expenses.forEach((tx) => {
    const d = new Date(tx.date);
    const day = d.getDay(); // 0 is Sunday, 6 is Saturday
    const dateStr = d.toISOString().split('T')[0];

    if (day === 0 || day === 6) {
      weekendSum += tx.amount;
      weekendDays.add(dateStr);
    } else {
      weekdaySum += tx.amount;
      weekdayDays.add(dateStr);
    }
  });

  const weekdayAvg = weekdayDays.size > 0 ? weekdaySum / weekdayDays.size : 0;
  const weekendAvg = weekendDays.size > 0 ? weekendSum / weekendDays.size : 0;

  if (weekendAvg > weekdayAvg * 1.4 && weekendSum > 1000) {
    const weeklyDifference = (weekendAvg - weekdayAvg) * 2; // Saturday + Sunday excess
    const monthlyDifference = weeklyDifference * 4.3;

    return [
      {
        id: 'weekend-overspend',
        type: 'weekend_overspend',
        title: 'Weekend Spend Creep',
        subtitle: `Weekend average is ${Math.round((weekendAvg / (weekdayAvg || 1)) * 100 - 100)}% higher`,
        metric: `+₹${Math.round(weeklyDifference)} / wknd`,
        impactAmount: Math.round(monthlyDifference),
        whatHappened: `Your average spending on Saturdays and Sundays (₹${Math.round(
          weekendAvg
        )}) is significantly higher than your weekday average (₹${Math.round(weekdayAvg)}).`,
        why: `Weekends offer more free time and social triggers that encourage friction-free leisure spending.`,
        whatToDo: `Establish a dedicated 'Weekend Allowance' in cash or in a sub-wallet to physically cap leisure expenses.`,
        priority: monthlyDifference > 5000 ? 'high' : 'medium',
      },
    ];
  }

  return [];
}

/**
 * Detects heavy subscription burden (fixed repeating expenses).
 */
export function detectSubscriptionBurden(
  transactions: Transaction[],
  _categories: Category[]
): InsightCardData[] {
  const expenses = transactions.filter((t) => t.type === 'expense');
  if (expenses.length === 0) return [];

  // Match standard subscription tags or recurring markers
  const subKeywords = ['netflix', 'spotify', 'youtube', 'prime', 'adobe', 'apple', 'icloud', 'google', 'recharge', 'rent', 'membership', 'gym', 'hosting', 'sub'];
  
  const subExpenses = expenses.filter((tx) => {
    if (tx.isRecurring) return true;
    const desc = (tx.description || '').toLowerCase();
    const merchant = (tx.merchant || '').toLowerCase();
    return subKeywords.some((kw) => desc.includes(kw) || merchant.includes(kw));
  });

  if (subExpenses.length === 0) return [];

  const totalSubs = subExpenses.reduce((sum, tx) => sum + tx.amount, 0);

  return [
    {
      id: 'subscription-burden',
      type: 'subscription',
      title: 'Subscription Burden',
      subtitle: `Tracking ${subExpenses.length} recurring drafts`,
      metric: `₹${Math.round(totalSubs)} / mo`,
      impactAmount: Math.round(totalSubs),
      whatHappened: `You have ₹${Math.round(
        totalSubs
      )} tied up in ${subExpenses.length} repeating digital billing items or memberships.`,
      why: `Automated payments feel invisible, causing 'subscription creep' that locks up liquid income.`,
      whatToDo: `Review your settings and cancel any services you haven't opened in the past 14 days.`,
      priority: totalSubs > 3000 ? 'high' : 'medium',
    },
  ];
}

/**
 * Detects small recurring leakages (e.g. coffee, snacks, small convenience fees).
 */
export function detectMoneyLeaks(transactions: Transaction[]): InsightCardData[] {
  const expenses = transactions.filter((t) => t.type === 'expense');
  if (expenses.length < 5) return [];

  // Group by merchant and find small transactions (< ₹300) with high frequency (>= 3 times)
  const frequencyMap: { [key: string]: { total: number; count: number; txs: Transaction[] } } = {};

  expenses.forEach((tx) => {
    if (!tx.merchant || tx.amount > 300) return;
    const key = tx.merchant.trim().toLowerCase();
    if (!frequencyMap[key]) {
      frequencyMap[key] = { total: 0, count: 0, txs: [] };
    }
    frequencyMap[key].total += tx.amount;
    frequencyMap[key].count += 1;
    frequencyMap[key].txs.push(tx);
  });

  const leaks = Object.entries(frequencyMap)
    .filter(([_, data]) => data.count >= 3)
    .map(([merchant, data]) => ({
      merchant: data.txs[0].merchant || merchant,
      total: data.total,
      count: data.count,
    }));

  if (leaks.length === 0) return [];

  // Take the top leak
  const topLeak = leaks.sort((a, b) => b.total - a.total)[0];

  return [
    {
      id: 'money-leak',
      type: 'money_leak',
      title: 'Micro-Spending Leak',
      subtitle: `Frequent small spends at ${topLeak.merchant}`,
      metric: `${topLeak.count} visits`,
      impactAmount: topLeak.total,
      whatHappened: `You spent a total of ₹${Math.round(
        topLeak.total
      )} across ${topLeak.count} transactions at ${topLeak.merchant} this month.`,
      why: `Small, low-friction expenses (under ₹300) register as insignificant in the moment but create major cash flow leaks.`,
      whatToDo: `Try consolidating visits or setting a hard weekly transaction limit of ₹500 for ${topLeak.merchant}.`,
      priority: topLeak.total > 1500 ? 'high' : 'medium',
    },
  ];
}

/**
 * Detects if spending rate is too high relative to income.
 */
export function detectSalaryRisk(
  transactions: Transaction[],
  _currentBalance: number
): InsightCardData[] {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthExpenses = transactions.filter(
    (t) => t.type === 'expense' && new Date(t.date) >= startOfMonth
  );
  const monthIncome = transactions.filter(
    (t) => t.type === 'income' && new Date(t.date) >= startOfMonth
  );

  const totalExpense = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = monthIncome.reduce((sum, t) => sum + t.amount, 0);

  if (totalIncome > 0 && totalExpense > totalIncome * 0.8) {
    const survivalPercentage = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
    return [
      {
        id: 'salary-risk',
        type: 'salary_risk',
        title: 'Low Cash Cushion',
        subtitle: `Spent ${Math.round((totalExpense / totalIncome) * 100)}% of income`,
        metric: `${survivalPercentage}% cushion`,
        impactAmount: Math.round(totalIncome - totalExpense),
        whatHappened: `You have consumed ₹${Math.round(
          totalExpense
        )} out of ₹${Math.round(totalIncome)} incoming salary funds for this month.`,
        why: `High fixed costs combined with accelerated early-month variable outlays leaves very little safety buffer.`,
        whatToDo: `Slow down discretionary spending on dining and shopping for the next 7 days.`,
        priority: 'high',
      },
    ];
  }

  return [];
}

function toInsightsTransactions(transactions: Transaction[]): InsightsTransaction[] {
  return transactions.map((tx) => ({
    id: tx.id,
    accountId: tx.accountId,
    type: tx.type,
    flowType: tx.type === 'income' ? 'income' : 'expense',
    amount: Math.abs(Number(tx.amount) || 0),
    categoryId: tx.categoryId ?? null,
    merchant: tx.merchant ?? null,
    description: tx.description ?? null,
    date: new Date(tx.date),
    dedupeGroupId: tx.dedupeGroupId ?? null,
  }));
}

function formatCurrency(amount: number): string {
  return `Rs ${Math.round(amount)}`;
}

function mapSubscriptionCandidateToInsight(
  candidate: SubscriptionCandidate
): InsightCardData {
  const cadenceLabel = candidate.frequencyType === 'monthly' ? 'month' : 'week';
  const priority: InsightCardData['priority'] =
    candidate.confidence === 'likely' && candidate.avgAmount >= 500 ? 'high' : 'medium';

  return {
    id: `subscription-candidate-${candidate.normalizedMerchant}-${candidate.transactionIds[0] ?? 'unknown'}`,
    type: 'subscription',
    title: 'Recurring Subscription Detected',
    subtitle: `${candidate.merchant} every ${candidate.intervalDays} days`,
    metric: `${formatCurrency(candidate.avgAmount)} / ${cadenceLabel}`,
    impactAmount: Math.round(candidate.avgAmount),
    whatHappened: `${candidate.occurrencesCount} similar payments to ${candidate.merchant} were detected on a ${candidate.frequencyType} cadence.`,
    why: `A repeated merchant cadence suggests a subscription or recurring commitment that quietly reduces flexible cash flow.`,
    whatToDo: `Review ${candidate.merchant} and keep it only if you still use it regularly.`,
    priority,
  };
}

function mapUnusualSpendCandidateToInsight(
  candidate: UnusualSpendCandidate
): InsightCardData {
  return {
    id: `unusual-spend-${candidate.transactionId}`,
    type: 'unusual_spend',
    title: 'Unusual Spending Detected',
    subtitle: `${formatCurrency(candidate.transactionAmount)} at ${candidate.merchant} vs usual ${formatCurrency(candidate.baselineMeanAmount)}`,
    metric: `${candidate.deviationRatio.toFixed(1)}x usual`,
    impactAmount: Math.round(candidate.deviationAmount),
    whatHappened: `A payment of ${formatCurrency(candidate.transactionAmount)} at ${candidate.merchant} was much higher than your prior average of ${formatCurrency(candidate.baselineMeanAmount)} across ${candidate.baselineCount} earlier transactions.`,
    why: `This merchant-level spike stands out from your normal local transaction history and may reflect an exceptional bill or accidental overspend.`,
    whatToDo: `Double-check whether this was intentional and consider watching ${candidate.merchant} more closely this month.`,
    priority: candidate.severity,
  };
}

/**
 * Combines all detectors to return a feed of current insights.
 */
export function generateAllInsights(
  transactions: Transaction[],
  categories: Category[],
  currentBalance: number
): InsightCardData[] {
  if (transactions.length === 0) {
    return [];
  }

  const normalizedTransactions = toInsightsTransactions(transactions);
  const structuredSubscriptionCandidates = detectSubscriptionCandidates(normalizedTransactions);
  const unusualSpendCandidates = detectUnusualSpendCandidates(normalizedTransactions);
  const heuristicSubscriptionInsights =
    structuredSubscriptionCandidates.length > 0 ? [] : detectSubscriptionBurden(transactions, categories);

  return [
    ...detectImpulseSpending(transactions),
    ...detectWeekendOverspend(transactions),
    ...structuredSubscriptionCandidates.map(mapSubscriptionCandidateToInsight),
    ...unusualSpendCandidates.map(mapUnusualSpendCandidateToInsight),
    ...heuristicSubscriptionInsights,
    ...detectMoneyLeaks(transactions),
    ...detectSalaryRisk(transactions, currentBalance),
  ];
}

/**
 * Detects recurring subscription candidates locally from normalized InsightsTransaction history.
 */
export function detectSubscriptionCandidates(txs: InsightsTransaction[]): SubscriptionCandidate[] {
  const filteredTxs = filterDuplicateTransactions(txs);
  
  // Group transactions by normalized merchant
  const groups: Record<string, InsightsTransaction[]> = {};
  filteredTxs.forEach((tx) => {
    if (tx.flowType !== 'expense' || !tx.merchant) return;
    const norm = tx.merchant.toLowerCase().trim();
    if (!norm) return;
    if (!groups[norm]) {
      groups[norm] = [];
    }
    groups[norm].push(tx);
  });

  const candidates: SubscriptionCandidate[] = [];

  for (const [normMerchant, group] of Object.entries(groups)) {
    if (group.length < 2) continue;

    // Sort chronologically
    group.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate average amount
    const avgAmount = group.reduce((sum, t) => sum + t.amount, 0) / group.length;

    // Check amount variance <= 10%: abs(amount - avgAmount) / avgAmount <= 0.10
    const isAmountStable = group.every((t) => {
      if (avgAmount === 0) return t.amount === 0;
      return Math.abs(t.amount - avgAmount) / avgAmount <= 0.10;
    });
    if (!isAmountStable) continue;

    // Calculate adjacent intervals in days
    const intervals: number[] = [];
    for (let i = 1; i < group.length; i++) {
      const diffMs = group[i].date.getTime() - group[i - 1].date.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      intervals.push(diffDays);
    }

    // All intervals must fit either weekly (6 to 8 days) or monthly (27 to 33 days)
    const isAllWeekly = intervals.every((days) => days >= 6 && days <= 8);
    const isAllMonthly = intervals.every((days) => days >= 27 && days <= 33);

    if (!isAllWeekly && !isAllMonthly) continue;

    const frequencyType = isAllWeekly ? 'weekly' : 'monthly';
    const totalInterval = intervals.reduce((sum, val) => sum + val, 0);
    const avgInterval = totalInterval / intervals.length;

    candidates.push({
      merchant: group[group.length - 1].merchant || '',
      normalizedMerchant: normMerchant,
      avgAmount,
      intervalDays: Math.round(avgInterval),
      frequencyType,
      occurrencesCount: group.length,
      confidence: group.length === 2 ? 'possible' : 'likely',
      lastDate: group[group.length - 1].date,
      transactionIds: group.map((t) => t.id),
    });
  }

  // Sort output by lastDate descending
  return candidates.sort((a, b) => b.lastDate.getTime() - a.lastDate.getTime());
}

function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;

  const variance =
    values.reduce((sum, value) => sum + (value - mean) * (value - mean), 0) / values.length;

  return Math.sqrt(variance);
}

/**
 * Detects unusually high merchant-level expenses using prior-only local history.
 */
export function detectUnusualSpendCandidates(
  txs: InsightsTransaction[]
): UnusualSpendCandidate[] {
  const filteredTxs = filterDuplicateTransactions(txs);
  const groups: Record<string, InsightsTransaction[]> = {};

  filteredTxs.forEach((tx) => {
    if (tx.flowType !== 'expense' || !tx.merchant) return;

    const normalizedMerchant = tx.merchant.toLowerCase().trim();
    if (!normalizedMerchant) return;

    if (!groups[normalizedMerchant]) {
      groups[normalizedMerchant] = [];
    }

    groups[normalizedMerchant].push(tx);
  });

  const candidates: UnusualSpendCandidate[] = [];

  for (const [normalizedMerchant, group] of Object.entries(groups)) {
    if (group.length < 4) continue;

    const sortedGroup = [...group].sort((a, b) => a.date.getTime() - b.date.getTime());

    for (let i = 3; i < sortedGroup.length; i++) {
      const currentTx = sortedGroup[i];
      const priorTxs = sortedGroup.slice(0, i);
      const priorAmounts = priorTxs.map((tx) => tx.amount);
      const priorMean = calculateMean(priorAmounts);

      if (priorTxs.length < 3 || priorMean < 100) {
        continue;
      }

      const priorStdDev = calculateStdDev(priorAmounts, priorMean);
      const baselineMaxAmount = Math.max(...priorAmounts);
      const thresholdMultiplier = priorMean * 2.5;
      const thresholdDeviation = priorMean + Math.max(priorStdDev * 2, 500);

      if (
        currentTx.amount < thresholdMultiplier ||
        currentTx.amount < thresholdDeviation
      ) {
        continue;
      }

      const deviationAmount = currentTx.amount - priorMean;
      const deviationRatio = priorMean === 0 ? 0 : currentTx.amount / priorMean;
      const zScore = priorStdDev === 0 ? null : deviationAmount / priorStdDev;
      const severity =
        currentTx.amount >= priorMean * 3 || (zScore !== null && zScore >= 3) ? 'high' : 'medium';

      candidates.push({
        transactionId: currentTx.id,
        merchant: currentTx.merchant,
        normalizedMerchant,
        transactionDate: currentTx.date,
        transactionAmount: currentTx.amount,
        baselineCount: priorTxs.length,
        baselineMeanAmount: priorMean,
        baselineStdDevAmount: priorStdDev,
        baselineMaxAmount,
        deviationAmount,
        deviationRatio,
        zScore,
        severity,
      });
    }
  }

  return candidates.sort((a, b) => {
    const dateDiff = b.transactionDate.getTime() - a.transactionDate.getTime();
    if (dateDiff !== 0) {
      return dateDiff;
    }

    return b.deviationRatio - a.deviationRatio;
  });
}

