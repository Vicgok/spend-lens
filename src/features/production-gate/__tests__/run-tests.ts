import assert from 'node:assert';
import { DEFAULT_CATEGORIES } from '../../categorizer/categories';
import { categorizeTransactionDetailed } from '../../categorizer/categorizer';
import {
  dedupeTransactions,
  parseTransactionSMS,
  TransactionInput,
} from '../../sms-parser/engine';
import { buildInsightsSnapshot } from '../../insights-engine/aggregates';
import { Account, Transaction } from '@/types';

type Fixture = {
  id: string;
  body: string;
  receivedDate: string;
  sender: string;
  expectedCategoryId?: string;
  expectedMerchant?: string | null;
};

const fixtures: Fixture[] = [
  {
    id: 'salary-jul',
    body: 'Salary of Rs. 50000 credited to A/c XX1234 on 01-Jul-26. Ref SAL123.',
    receivedDate: '2026-07-01T09:00:00.000Z',
    sender: 'AD-HDFCBK-S',
    expectedCategoryId: 'cat_income',
    expectedMerchant: null,
  },
  {
    id: 'netflix-jun',
    body: 'Rs. 499 spent at Netflix on 10-Jun-26 from Card XX9876.',
    receivedDate: '2026-06-10T08:00:00.000Z',
    sender: 'AX-ICICIT-S',
    expectedCategoryId: 'cat_entertainment',
    expectedMerchant: 'Netflix',
  },
  {
    id: 'netflix-jul',
    body: 'Rs. 499 spent at Netflix on 10-Jul-26 from Card XX9876.',
    receivedDate: '2026-07-10T08:00:00.000Z',
    sender: 'AX-ICICIT-S',
    expectedCategoryId: 'cat_entertainment',
    expectedMerchant: 'Netflix',
  },
  {
    id: 'swiggy-primary',
    body: 'Rs. 1500 debited from A/c XX1234 on 15-Jul-26 for UPI/Swiggy. UPI Ref 111222333444.',
    receivedDate: '2026-07-15T20:10:00.000Z',
    sender: 'AD-HDFCBK-S',
    expectedCategoryId: 'cat_food',
    expectedMerchant: 'Swiggy',
  },
  {
    id: 'swiggy-duplicate',
    body: 'Alert: Rs. 1500 paid to Swiggy from A/c 1234 on 15-Jul-26. UPI Ref 111222333444.',
    receivedDate: '2026-07-15T20:12:00.000Z',
    sender: 'AD-HDFCBK-S',
    expectedCategoryId: 'cat_food',
    expectedMerchant: 'Swiggy',
  },
];

function toTransactionType(value: 'debit' | 'credit' | null): Transaction['type'] {
  return value === 'credit' ? 'income' : 'expense';
}

function buildAccountId(input: TransactionInput): string {
  const parsed = input.parsed;
  assert(parsed);
  const accountType = parsed.account.type?.toLowerCase() ?? 'unknown';
  const identifier = parsed.account.number ?? parsed.account.name ?? 'unmapped';
  return `${accountType}-${identifier.toLowerCase().replace(/\s+/g, '-')}`;
}

function buildAccountsFromInputs(inputs: TransactionInput[]): Account[] {
  const seen = new Map<string, Account>();

  for (const input of inputs) {
    const parsed = input.parsed;
    assert(parsed);
    const accountId = buildAccountId(input);
    if (seen.has(accountId)) continue;

    seen.set(accountId, {
      id: accountId,
      name: parsed.account.name ?? parsed.account.number ?? accountId,
      type:
        parsed.account.type === 'CARD'
          ? 'credit_card'
          : parsed.account.type === 'WALLET'
          ? 'wallet'
          : 'bank',
      balance: 0,
      currency: 'INR',
      icon: null,
      color: null,
      bankId: null,
      createdAt: input.date,
      updatedAt: input.date,
    });
  }

  return [...seen.values()];
}

const parsedInputs: TransactionInput[] = fixtures.map((fixture) => {
  const parsed = parseTransactionSMS(fixture.body, fixture.receivedDate, fixture.sender);
  assert(parsed, `Expected parser output for fixture ${fixture.id}`);
  return {
    body: fixture.body,
    date: fixture.receivedDate,
    parsed,
  };
});

const dedupedGroups = dedupeTransactions(parsedInputs);
assert.equal(dedupedGroups.length, 4);
assert.equal(dedupedGroups.filter((group) => group.duplicates.length > 0).length, 1);
assert.equal(dedupedGroups.find((group) => group.duplicates.length > 0)?.duplicates.length, 1);

const canonicalInputs = dedupedGroups.map((group) => group.canonical);
const accounts = buildAccountsFromInputs(canonicalInputs);

const transactions: Transaction[] = canonicalInputs.map((input, index) => {
  const parsed = input.parsed;
  assert(parsed);
  const categoryResult = categorizeTransactionDetailed(
    parsed.transaction.merchant,
    parsed.rawBody,
    toTransactionType(parsed.transaction.type)
  );

  if (parsed.transaction.merchant === 'Netflix') {
    assert.equal(categoryResult.categoryId, 'cat_entertainment');
    assert.ok(categoryResult.matchedKeywords.includes('netflix'));
  }

  if (parsed.transaction.merchant === 'Swiggy') {
    assert.equal(categoryResult.categoryId, 'cat_food');
    assert.ok(categoryResult.matchedKeywords.includes('swiggy'));
  }

  return {
    id: `gate-${index + 1}`,
    accountId: buildAccountId(input),
    type: toTransactionType(parsed.transaction.type),
    amount: parsed.transaction.amount ?? 0,
    categoryId: categoryResult.categoryId,
    merchant: parsed.transaction.merchant,
    description: parsed.rawBody,
    date: parsed.date ?? input.date,
    source: 'sms',
    smsHash: `gate-hash-${index + 1}`,
    dedupeGroupId: dedupedGroups[index]?.groupKey ?? null,
    dedupeVersion: 'phase-3-gate',
    isRecurring: false,
    tags: [],
    createdAt: input.date,
    syncedAt: null,
  };
});

assert.equal(
  transactions.find((transaction) => transaction.merchant === 'Swiggy')?.categoryId,
  'cat_food'
);
assert.equal(
  transactions.filter((transaction) => transaction.merchant === 'Netflix').length,
  2
);

const snapshot = buildInsightsSnapshot({
  transactions,
  categories: DEFAULT_CATEGORIES,
  accounts,
  now: new Date('2026-07-20T12:00:00.000Z'),
});

assert.equal(snapshot.transactionCount, 4);
assert.equal(snapshot.duplicateSafeTransactionCount, 4);
assert.equal(snapshot.periods.monthly.incomeTotal, 50000);
assert.equal(snapshot.periods.monthly.expenseTotal, 1999);
assert.equal(snapshot.subscriptionCandidates.length, 1);
assert.equal(snapshot.subscriptionCandidates[0]?.merchant, 'Netflix');
assert.equal(snapshot.subscriptionCandidates[0]?.confidence, 'medium');
assert.equal(snapshot.categoryBreakdown[0]?.categoryId, 'cat_food');
assert.equal(snapshot.sourceSummary.sms, 4);

console.log('production-gate tests: PASS');
