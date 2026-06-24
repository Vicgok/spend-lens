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

export interface UnusualSpendCandidate {
  transactionId: string;
  merchant: string;
  normalizedMerchant: string;
  transactionDate: Date;
  transactionAmount: number;
  baselineCount: number;
  baselineMeanAmount: number;
  baselineStdDevAmount: number;
  baselineMaxAmount: number;
  deviationAmount: number;
  deviationRatio: number;
  zScore: number | null;
  severity: 'medium' | 'high';
}
