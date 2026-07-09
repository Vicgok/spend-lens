import { getCategoryById } from '@/features/categorizer/categorizer';
import { formatCurrency } from '@/utils/currency';
import { Transaction, TransactionType } from '@/types';

export type ChartMode = 'day' | 'week' | 'month' | 'year';

export interface ChartDataPoint {
  label: string;
  fullLabel: string;
  actual: number;
  budget: number;
  categories: string[];
}

export interface HistoryChartSummary {
  amount: string;
  budget: string;
  deltaLabel: string;
  categoryLabel: string;
  statusTone: string;
}

export interface HistorySection {
  title: string;
  data: Transaction[];
}

export function buildTimelineAnalyticsData(
  transactions: Transaction[],
  mode: ChartMode,
  baseDate: Date
): ChartDataPoint[] {
  const now = new Date();
  const isCurrentMonth =
    baseDate.getFullYear() === now.getFullYear() &&
    baseDate.getMonth() === now.getMonth();
  const referenceDate = isCurrentMonth
    ? now
    : new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);

  if (mode === 'day') {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fullDayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    return Array.from({ length: 7 }, (_, offset) => {
      const index = 6 - offset;
      const date = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate() - index
      );
      const dayStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const dayTransactions = transactions.filter((transaction) => {
        const time = new Date(transaction.date).getTime();
        return time >= dayStart && time < dayEnd;
      });

      return {
        label: dayNames[date.getDay()],
        fullLabel: `${fullDayNames[date.getDay()]} ${date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}`,
        actual: dayTransactions.reduce(
          (sum, transaction) => sum + transaction.amount,
          0
        ),
        budget: date.getDay() === 0 || date.getDay() === 6 ? 1800 : 1000,
        categories: Array.from(
          new Set(
            dayTransactions.map((transaction) =>
              getCategoryById(transaction.categoryId || 'cat_uncategorized').name
            )
          )
        ).slice(0, 2),
      };
    });
  }

  if (mode === 'week') {
    return Array.from({ length: 4 }, (_, offset) => {
      const index = 3 - offset;
      const start = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate() - (index * 7 + 7)
      ).getTime();
      const end = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate() - index * 7
      ).getTime();
      const weekTransactions = transactions.filter((transaction) => {
        const time = new Date(transaction.date).getTime();
        return time >= start && time < end;
      });

      return {
        label: index === 0 ? 'This Wk' : `W-${index}`,
        fullLabel: index === 0 ? 'Current Week' : `Week - ${index} Ago`,
        actual: weekTransactions.reduce(
          (sum, transaction) => sum + transaction.amount,
          0
        ),
        budget: 8000,
        categories: Array.from(
          new Set(
            weekTransactions.map((transaction) =>
              getCategoryById(transaction.categoryId || 'cat_uncategorized').name
            )
          )
        ).slice(0, 2),
      };
    });
  }

  if (mode === 'month') {
    return Array.from({ length: 6 }, (_, offset) => {
      const index = 5 - offset;
      const date = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth() - index,
        1
      );
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      const monthEnd = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        1
      ).getTime();
      const monthTransactions = transactions.filter((transaction) => {
        const time = new Date(transaction.date).getTime();
        return time >= monthStart && time < monthEnd;
      });

      return {
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        fullLabel: date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
        actual: monthTransactions.reduce(
          (sum, transaction) => sum + transaction.amount,
          0
        ),
        budget: 30000,
        categories: Array.from(
          new Set(
            monthTransactions.map((transaction) =>
              getCategoryById(transaction.categoryId || 'cat_uncategorized').name
            )
          )
        ).slice(0, 2),
      };
    });
  }

  return Array.from({ length: 3 }, (_, offset) => {
    const index = 2 - offset;
    const year = referenceDate.getFullYear() - index;
    const yearStart = new Date(year, 0, 1).getTime();
    const yearEnd = new Date(year + 1, 0, 1).getTime();
    const yearTransactions = transactions.filter((transaction) => {
      const time = new Date(transaction.date).getTime();
      return time >= yearStart && time < yearEnd;
    });

    return {
      label: String(year),
      fullLabel: `Year ${year}`,
      actual: yearTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      ),
      budget: 360000,
      categories: Array.from(
        new Set(
          yearTransactions.map((transaction) =>
            getCategoryById(transaction.categoryId || 'cat_uncategorized').name
          )
        )
      ).slice(0, 2),
    };
  });
}

export function buildHistoryChartData(points: ChartDataPoint[]) {
  return points.map((point) => ({
    label: point.label,
    value: point.actual,
    target: point.budget,
  }));
}

export function buildHistoryChartSummary(
  selectedPoint: ChartDataPoint | null,
  statusColors: {
    secondary: string;
    expense: string;
    success: string;
  }
): HistoryChartSummary {
  if (!selectedPoint) {
    return {
      amount: formatCurrency(0),
      budget: formatCurrency(0),
      deltaLabel: 'No activity',
      categoryLabel: 'Add transactions to populate this period.',
      statusTone: statusColors.secondary,
    };
  }

  const delta = selectedPoint.actual - selectedPoint.budget;
  const isOverTarget = delta > 0;

  return {
    amount: formatCurrency(selectedPoint.actual),
    budget: formatCurrency(selectedPoint.budget),
    deltaLabel:
      selectedPoint.actual === 0
        ? 'No activity'
        : isOverTarget
          ? `${formatCurrency(delta)} above target`
          : `${formatCurrency(Math.abs(delta))} below target`,
    categoryLabel:
      selectedPoint.categories.length > 0
        ? selectedPoint.categories.join(', ')
        : 'No activity recorded',
    statusTone:
      selectedPoint.actual === 0
        ? statusColors.secondary
        : isOverTarget
          ? statusColors.expense
          : statusColors.success,
  };
}

export function buildTransactionSections(
  transactions: Transaction[]
): HistorySection[] {
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const yesterday = today - 24 * 60 * 60 * 1000;
  const startOfWeek = today - 7 * 24 * 60 * 60 * 1000;

  const buckets = {
    Today: [] as Transaction[],
    Yesterday: [] as Transaction[],
    'This Week': [] as Transaction[],
    Earlier: [] as Transaction[],
  };

  transactions.forEach((transaction) => {
    const time = new Date(transaction.date).getTime();
    if (time >= today) {
      buckets.Today.push(transaction);
    } else if (time >= yesterday) {
      buckets.Yesterday.push(transaction);
    } else if (time >= startOfWeek) {
      buckets['This Week'].push(transaction);
    } else {
      buckets.Earlier.push(transaction);
    }
  });

  return Object.entries(buckets)
    .filter(([, data]) => data.length > 0)
    .map(([title, data]) => ({ title, data }));
}

export function buildFinancialObservation(transactions: Transaction[]): string {
  if (transactions.length === 0) {
    return 'No spending data available for observations yet.';
  }

  const categorySpending: Record<string, number> = {};
  transactions
    .filter((transaction) => transaction.type === 'expense')
    .forEach((transaction) => {
      const category = getCategoryById(
        transaction.categoryId || 'cat_uncategorized'
      );
      categorySpending[category.name] =
        (categorySpending[category.name] || 0) + transaction.amount;
    });

  const categories = Object.keys(categorySpending);
  if (categories.length === 0) {
    return 'No expenses recorded this month.';
  }

  let maxCategory = categories[0];
  let maxAmount = categorySpending[maxCategory];
  for (const category of categories) {
    if (categorySpending[category] > maxAmount) {
      maxCategory = category;
      maxAmount = categorySpending[category];
    }
  }

  return `Most spending this month comes from ${maxCategory}.`;
}

export function buildHistoryMonthOptions(): Date[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, index) => {
    return new Date(now.getFullYear(), now.getMonth() - index, 1);
  });
}

export function getDefaultHistoryTab(): TransactionType {
  return 'expense';
}
