import { InsightsTransaction } from './types';

/**
 * Normalizes a transaction record to conform strictly to the InsightsTransaction contract.
 */
export function normalizeTransaction(tx: any): InsightsTransaction {
  // Amount normalization
  let amount = Number(tx?.amount);
  if (isNaN(amount)) {
    amount = 0;
  } else {
    amount = Math.abs(amount);
  }

  // Date normalization
  let date = new Date();
  if (tx?.date) {
    const parsedDate = new Date(tx.date);
    if (!isNaN(parsedDate.getTime())) {
      date = parsedDate;
    }
  }

  // Type mapping: debit -> expense, credit -> income, or preserve existing
  const rawType = String(tx?.type || '').toLowerCase();
  let flowType: 'income' | 'expense' = 'expense';
  if (rawType === 'credit' || rawType === 'income') {
    flowType = 'income';
  } else if (rawType === 'debit' || rawType === 'expense') {
    flowType = 'expense';
  }

  // Merchant normalization
  let merchant = tx?.merchant;
  if (typeof merchant === 'string') {
    merchant = merchant.trim();
    if (merchant === '') {
      merchant = null;
    }
  } else {
    merchant = null;
  }

  // Category normalization
  let categoryId = tx?.categoryId;
  if (typeof categoryId === 'string') {
    categoryId = categoryId.trim();
    if (categoryId === '') {
      categoryId = null;
    }
  } else {
    categoryId = null;
  }

  // Account normalization
  let accountId = tx?.accountId;
  if (typeof accountId === 'string' && accountId.trim() !== '') {
    accountId = accountId.trim();
  } else {
    accountId = 'unknown-account';
  }

  // DedupeGroupId normalization
  let dedupeGroupId = tx?.dedupeGroupId;
  if (typeof dedupeGroupId === 'string') {
    dedupeGroupId = dedupeGroupId.trim();
    if (dedupeGroupId === '') {
      dedupeGroupId = null;
    }
  } else {
    dedupeGroupId = null;
  }

  return {
    id: String(tx?.id || ''),
    accountId,
    type: String(tx?.type || ''),
    flowType,
    amount,
    categoryId,
    merchant,
    description: tx?.description || null,
    date,
    dedupeGroupId,
  };
}

/**
 * Filter transactions so that if a dedupeGroupId exists, we keep the first canonical transaction.
 * If dedupeGroupId is missing, we use the transaction id.
 * Deterministic ordering is applied.
 */
export function filterDuplicateTransactions(txs: InsightsTransaction[]): InsightsTransaction[] {
  // Sort deterministically: chronologically (ascending), then by ID (alphabetically ascending)
  const sorted = [...txs].sort((a, b) => {
    const timeDiff = a.date.getTime() - b.date.getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.id.localeCompare(b.id);
  });

  const seenKeys = new Set<string>();
  const result: InsightsTransaction[] = [];

  for (const tx of sorted) {
    const key = tx.dedupeGroupId ? tx.dedupeGroupId : tx.id;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      result.push(tx);
    }
  }

  return result;
}
