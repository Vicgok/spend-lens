import { Transaction } from '../../types';

/**
 * Calculates the predicted month-end balance by analyzing current income,
 * expenses, and average daily burn rate, then extrapolating for the remaining
 * days of the month.
 */
export function calculatePredictedMonthEndBalance(
  transactions: Transaction[],
  currentBalance: number
): { predictedBalance: number; burnRate: number; daysRemaining: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0); // Last day of current month
  
  const totalDaysInMonth = endOfMonth.getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(0, totalDaysInMonth - currentDay);

  // Filter transactions for the current month
  const currentMonthExpenses = transactions.filter(
    (t) => t.type === 'expense' && new Date(t.date) >= startOfMonth
  );

  const totalExpense = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

  // Burn rate = average expense per day elapsed
  const daysElapsed = Math.max(1, currentDay);
  const burnRate = totalExpense / daysElapsed;

  // Extrapolate remaining expense
  const projectedRemainingExpense = burnRate * daysRemaining;
  const predictedBalance = Math.max(0, currentBalance - projectedRemainingExpense);

  return {
    predictedBalance: Math.round(predictedBalance),
    burnRate: Math.round(burnRate),
    daysRemaining,
  };
}

/**
 * Calculates a Salary Survival Score (0 to 100) indicating how "safe" the user's
 * spending is relative to their monthly income.
 * 
 * Score meaning:
 * - 80-100: Excellent (saving 30%+)
 * - 50-79: Moderate (saving 10-29%)
 * - 0-49: At Risk (spending 90%+)
 */
export function calculateSalarySurvivalScore(transactions: Transaction[]): number {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const currentMonthTxs = transactions.filter(
    (t) => new Date(t.date) >= startOfMonth
  );

  const income = currentMonthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = currentMonthTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  if (income === 0) {
    // If no income recorded this month, look at overall expenses
    if (expenses === 0) return 100; // Fresh slate
    return Math.max(10, 100 - Math.round(expenses / 500)); // Deplete score gradually
  }

  const savingsRate = (income - expenses) / income; // can be negative

  if (savingsRate >= 0.3) {
    // 30% savings rate maps to 80-100
    // formula: 80 + (savingsRate - 0.3) * 28.5 (cap at 100)
    return Math.min(100, 80 + Math.round((savingsRate - 0.3) * 28.5));
  } else if (savingsRate >= 0.1) {
    // 10% to 29% savings rate maps to 50-79
    // formula: 50 + (savingsRate - 0.1) * 145
    return 50 + Math.round((savingsRate - 0.1) * 145);
  } else {
    // under 10% savings maps to 0-49
    // formula: max(0, 50 * (savingsRate + 0.1) / 0.2)
    const normalizedRate = savingsRate + 0.1; // e.g. -10% savings rate is 0, 10% is 0.2
    return Math.max(0, Math.min(49, Math.round(50 * (normalizedRate / 0.2))));
  }
}
