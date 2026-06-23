import { InsightsTransaction } from './types';
import { filterDuplicateTransactions } from './normalization';

/**
 * Helper to format a Date as YYYY-MM-DD local date.
 */
function toLocalDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Helper to format a Date as YYYY-WW (standard ISO week number format).
 */
function toYearWeekString(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const yyyy = d.getUTCFullYear();
  const ww = String(weekNo).padStart(2, '0');
  return `${yyyy}-${ww}`;
}

/**
 * Helper to get year-month (YYYY-MM).
 */
function toYearMonthString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

/**
 * Calculates daily spend (expense) totals.
 * Returns a mapping of YYYY-MM-DD -> total amount.
 */
export function calculateDailySpendTotal(txs: InsightsTransaction[]): Record<string, number> {
  const filtered = filterDuplicateTransactions(txs);
  const result: Record<string, number> = {};
  filtered.forEach((tx) => {
    if (tx.flowType !== 'expense') return;
    const dateStr = toLocalDateString(tx.date);
    result[dateStr] = (result[dateStr] || 0) + tx.amount;
  });
  return result;
}

/**
 * Calculates weekly spend (expense) totals.
 * Returns a mapping of YYYY-WW -> total amount.
 */
export function calculateWeeklySpendTotal(txs: InsightsTransaction[]): Record<string, number> {
  const filtered = filterDuplicateTransactions(txs);
  const result: Record<string, number> = {};
  filtered.forEach((tx) => {
    if (tx.flowType !== 'expense') return;
    const weekStr = toYearWeekString(tx.date);
    result[weekStr] = (result[weekStr] || 0) + tx.amount;
  });
  return result;
}

/**
 * Calculates monthly spend (expense) totals.
 * Returns a mapping of YYYY-MM -> total amount.
 */
export function calculateMonthlySpendTotal(txs: InsightsTransaction[]): Record<string, number> {
  const filtered = filterDuplicateTransactions(txs);
  const result: Record<string, number> = {};
  filtered.forEach((tx) => {
    if (tx.flowType !== 'expense') return;
    const monthStr = toYearMonthString(tx.date);
    result[monthStr] = (result[monthStr] || 0) + tx.amount;
  });
  return result;
}

/**
 * Calculates category breakdown of expenses.
 * Returns a mapping of categoryId (or 'Uncategorized') -> total amount.
 */
export function calculateCategoryBreakdown(txs: InsightsTransaction[]): Record<string, number> {
  const filtered = filterDuplicateTransactions(txs);
  const result: Record<string, number> = {};
  filtered.forEach((tx) => {
    if (tx.flowType !== 'expense') return;
    const categoryKey = tx.categoryId || 'Uncategorized';
    result[categoryKey] = (result[categoryKey] || 0) + tx.amount;
  });
  return result;
}

/**
 * Calculates account-wise spend (expense) totals.
 * Returns a mapping of accountId -> total amount.
 */
export function calculateAccountWiseSpend(txs: InsightsTransaction[]): Record<string, number> {
  const filtered = filterDuplicateTransactions(txs);
  const result: Record<string, number> = {};
  filtered.forEach((tx) => {
    if (tx.flowType !== 'expense') return;
    result[tx.accountId] = (result[tx.accountId] || 0) + tx.amount;
  });
  return result;
}

/**
 * Calculates total income and total expense.
 */
export function calculateIncomeVsExpense(txs: InsightsTransaction[]): { income: number; expense: number } {
  const filtered = filterDuplicateTransactions(txs);
  let income = 0;
  let expense = 0;
  filtered.forEach((tx) => {
    if (tx.flowType === 'income') {
      income += tx.amount;
    } else if (tx.flowType === 'expense') {
      expense += tx.amount;
    }
  });
  return { income, expense };
}
