export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionSource = 'sms' | 'email' | 'manual';

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  categoryId: string | null;
  merchant: string | null;
  description: string | null;
  date: string; // ISO 8601
  source: TransactionSource;
  smsHash: string | null;
  isRecurring: boolean;
  tags: string[];
  createdAt: string;
  syncedAt: string | null;
}

export interface TransactionCreateInput {
  accountId: string;
  type: TransactionType;
  amount: number;
  categoryId?: string;
  merchant?: string;
  description?: string;
  date?: string;
  source: TransactionSource;
  smsHash?: string;
  isRecurring?: boolean;
  tags?: string[];
}

export interface TransactionFilter {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  type?: TransactionType;
  source?: TransactionSource;
  searchQuery?: string;
  accountId?: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
  byCategory: CategoryTotal[];
  dailyTotals: DailyTotal[];
}

export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  count: number;
  percentage: number;
}

export interface DailyTotal {
  date: string;
  income: number;
  expense: number;
}

export type AccountType = 'cash' | 'bank' | 'credit_card' | 'wallet';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  icon: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountCreateInput {
  name: string;
  type: AccountType;
  balance: number;
  currency?: string;
  icon?: string;
  color?: string;
}
