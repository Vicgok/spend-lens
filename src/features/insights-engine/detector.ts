import { Transaction, Category } from '../../types';

export interface InsightCardData {
  id: string;
  type:
    | 'money_leak'
    | 'subscription'
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
  categories: Category[]
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
  currentBalance: number
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

/**
 * Combines all detectors to return a feed of current insights.
 */
export function generateAllInsights(
  transactions: Transaction[],
  categories: Category[],
  currentBalance: number
): InsightCardData[] {
  return [
    ...detectImpulseSpending(transactions),
    ...detectWeekendOverspend(transactions),
    ...detectSubscriptionBurden(transactions, categories),
    ...detectMoneyLeaks(transactions),
    ...detectSalaryRisk(transactions, currentBalance),
  ];
}
