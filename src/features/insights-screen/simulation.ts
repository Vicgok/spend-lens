import { Category, Transaction } from '@/types';

const SCAN_STEP_DELAYS_MS = [800, 1600, 2400, 3200, 4000, 4800] as const;

export function startInsightsSimulation(input: {
  categories: Category[];
  refreshSourceData: () => Promise<void>;
  onStart: () => void;
  onStepChange: (step: number) => void;
  onComplete: (transactions: Transaction[]) => void;
  onError?: (error: unknown) => void;
}) {
  input.onStart();
  input.onStepChange(0);

  const timeouts: ReturnType<typeof setTimeout>[] = [];
  timeouts.push(setTimeout(() => input.onStepChange(1), SCAN_STEP_DELAYS_MS[0]));
  timeouts.push(setTimeout(() => input.onStepChange(2), SCAN_STEP_DELAYS_MS[1]));
  timeouts.push(
    setTimeout(async () => {
      input.onStepChange(3);
      try {
        await input.refreshSourceData();
      } catch (error) {
        input.onError?.(error);
      }
    }, SCAN_STEP_DELAYS_MS[2])
  );
  timeouts.push(setTimeout(() => input.onStepChange(4), SCAN_STEP_DELAYS_MS[3]));
  timeouts.push(setTimeout(() => input.onStepChange(5), SCAN_STEP_DELAYS_MS[4]));
  timeouts.push(
    setTimeout(() => {
      input.onComplete(buildMockTransactions(input.categories));
    }, SCAN_STEP_DELAYS_MS[5])
  );

  return () => {
    timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
  };
}

function buildMockTransactions(categories: Category[]): Transaction[] {
  const foodId =
    categories.find(
      (category) =>
        category.name.toLowerCase().includes('food') ||
        category.name.toLowerCase().includes('dining')
    )?.id || 'mock-food';
  const shopId =
    categories.find(
      (category) =>
        category.name.toLowerCase().includes('shop') ||
        category.name.toLowerCase().includes('cloth')
    )?.id || 'mock-shop';

  const now = new Date();
  const getPastDate = (daysAgo: number, hour: number) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - daysAgo,
      hour,
      30
    );
    return date.toISOString();
  };

  return [
    {
      id: 'mock-inc-1',
      accountId: 'mock-acc',
      type: 'income',
      amount: 60000,
      categoryId: null,
      merchant: 'Salary Pay',
      description: 'Monthly salary credited',
      date: getPastDate(10, 10),
      source: 'manual',
      smsHash: null,
      isRecurring: true,
      tags: [],
      createdAt: now.toISOString(),
      syncedAt: null,
    },
    {
      id: 'mock-food-1',
      accountId: 'mock-acc',
      type: 'expense',
      amount: 1250,
      categoryId: foodId,
      merchant: 'Zomato',
      description: 'Dinner delivery',
      date: getPastDate(2, 20),
      source: 'manual',
      smsHash: null,
      isRecurring: false,
      tags: [],
      createdAt: now.toISOString(),
      syncedAt: null,
    },
    {
      id: 'mock-leak-1',
      accountId: 'mock-acc',
      type: 'expense',
      amount: 280,
      categoryId: foodId,
      merchant: 'Starbucks',
      description: 'Coffee spend',
      date: getPastDate(1, 16),
      source: 'manual',
      smsHash: null,
      isRecurring: false,
      tags: [],
      createdAt: now.toISOString(),
      syncedAt: null,
    },
    {
      id: 'mock-leak-2',
      accountId: 'mock-acc',
      type: 'expense',
      amount: 280,
      categoryId: foodId,
      merchant: 'Starbucks',
      description: 'Coffee spend',
      date: getPastDate(3, 16),
      source: 'manual',
      smsHash: null,
      isRecurring: false,
      tags: [],
      createdAt: now.toISOString(),
      syncedAt: null,
    },
    {
      id: 'mock-leak-3',
      accountId: 'mock-acc',
      type: 'expense',
      amount: 280,
      categoryId: foodId,
      merchant: 'Starbucks',
      description: 'Coffee spend',
      date: getPastDate(5, 16),
      source: 'manual',
      smsHash: null,
      isRecurring: false,
      tags: [],
      createdAt: now.toISOString(),
      syncedAt: null,
    },
    {
      id: 'mock-leak-4',
      accountId: 'mock-acc',
      type: 'expense',
      amount: 280,
      categoryId: foodId,
      merchant: 'Starbucks',
      description: 'Coffee spend',
      date: getPastDate(7, 16),
      source: 'manual',
      smsHash: null,
      isRecurring: false,
      tags: [],
      createdAt: now.toISOString(),
      syncedAt: null,
    },
    {
      id: 'mock-weekend-1',
      accountId: 'mock-acc',
      type: 'expense',
      amount: 4500,
      categoryId: shopId,
      merchant: 'Zara',
      description: 'Weekend shopping spree',
      date: (() => {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        while (date.getDay() !== 6 && date.getDay() !== 0) {
          date.setDate(date.getDate() - 1);
        }
        date.setHours(19, 0);
        return date.toISOString();
      })(),
      source: 'manual',
      smsHash: null,
      isRecurring: false,
      tags: [],
      createdAt: now.toISOString(),
      syncedAt: null,
    },
    {
      id: 'mock-cash-1',
      accountId: 'mock-acc',
      type: 'expense',
      amount: 2000,
      categoryId: null,
      merchant: 'HDFC ATM',
      description: 'Cash withdrawal ATM',
      date: (() => {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        while (date.getDay() !== 5) {
          date.setDate(date.getDate() - 1);
        }
        date.setHours(18, 0);
        return date.toISOString();
      })(),
      source: 'manual',
      smsHash: null,
      isRecurring: false,
      tags: [],
      createdAt: now.toISOString(),
      syncedAt: null,
    },
    {
      id: 'mock-sub-1',
      accountId: 'mock-acc',
      type: 'expense',
      amount: 129,
      categoryId: null,
      merchant: 'Spotify',
      description: 'Spotify Premium subscription',
      date: getPastDate(5, 12),
      source: 'manual',
      smsHash: null,
      isRecurring: true,
      tags: [],
      createdAt: now.toISOString(),
      syncedAt: null,
    },
    {
      id: 'mock-weekend-prev',
      accountId: 'mock-acc',
      type: 'expense',
      amount: 4000,
      categoryId: shopId,
      merchant: 'Zara',
      description: 'Previous month shopping',
      date: getPastDate(35, 15),
      source: 'manual',
      smsHash: null,
      isRecurring: false,
      tags: [],
      createdAt: now.toISOString(),
      syncedAt: null,
    },
  ];
}
