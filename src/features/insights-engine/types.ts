export interface InsightsTransaction {
  id: string;
  accountId: string;
  type: string;
  flowType: 'income' | 'expense';
  amount: number;
  categoryId: string | null;
  merchant: string | null;
  description: string | null;
  date: Date;
  dedupeGroupId: string | null;
}

export interface SubscriptionCandidate {
  merchant: string;
  normalizedMerchant: string;
  avgAmount: number;
  intervalDays: number;
  frequencyType: 'weekly' | 'monthly';
  occurrencesCount: number;
  confidence: 'possible' | 'likely';
  lastDate: Date;
  transactionIds: string[];
}
