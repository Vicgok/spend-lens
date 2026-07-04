import assert from 'node:assert';
import { Account, Category, Transaction } from '@/types';
import { buildInsightsSnapshot, buildObservationsSection } from '../aggregates';

const accounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Primary Bank',
    type: 'bank',
    balance: 100000,
    currency: 'INR',
    icon: null,
    color: null,
    bankId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'acc-2',
    name: 'Wallet',
    type: 'wallet',
    balance: 5000,
    currency: 'INR',
    icon: null,
    color: null,
    bankId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const categories: Category[] = [
  { id: 'food', name: 'Food', icon: 'utensils', color: '#ff0000', type: 'expense', isCustom: false, keywords: [], parentId: null, sortOrder: 1 },
  { id: 'shopping', name: 'Shopping', icon: 'bag', color: '#00ff00', type: 'expense', isCustom: false, keywords: [], parentId: null, sortOrder: 2 },
  { id: 'income', name: 'Income', icon: 'wallet', color: '#0000ff', type: 'income', isCustom: false, keywords: [], parentId: null, sortOrder: 3 },
];

const transactions: Transaction[] = [
  { id: 't1', accountId: 'acc-1', type: 'income', amount: 10000, categoryId: null, merchant: 'Employer', description: 'Salary', date: '2026-07-01T09:00:00.000Z', source: 'sms', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: true, tags: [], createdAt: '2026-07-01T09:00:00.000Z', syncedAt: null },
  { id: 't2', accountId: 'acc-1', type: 'expense', amount: 100, categoryId: 'food', merchant: 'Cafe', description: null, date: '2026-07-02T10:00:00.000Z', source: 'sms', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-07-02T10:00:00.000Z', syncedAt: null },
  { id: 't3', accountId: 'acc-1', type: 'expense', amount: 110, categoryId: 'food', merchant: 'Cafe', description: null, date: '2026-07-03T10:00:00.000Z', source: 'sms', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-07-03T10:00:00.000Z', syncedAt: null },
  { id: 't4', accountId: 'acc-1', type: 'expense', amount: 120, categoryId: 'food', merchant: 'Cafe', description: null, date: '2026-07-04T10:00:00.000Z', source: 'manual', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-07-04T10:00:00.000Z', syncedAt: null },
  { id: 't5', accountId: 'acc-1', type: 'expense', amount: 260, categoryId: 'food', merchant: 'Cafe', description: null, date: '2026-07-05T10:00:00.000Z', source: 'manual', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-07-05T10:00:00.000Z', syncedAt: null },
  { id: 't6', accountId: 'acc-2', type: 'expense', amount: 499, categoryId: 'shopping', merchant: 'Netflix', description: null, date: '2026-05-10T08:00:00.000Z', source: 'sms', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-05-10T08:00:00.000Z', syncedAt: null },
  { id: 't7', accountId: 'acc-2', type: 'expense', amount: 500, categoryId: 'shopping', merchant: 'Netflix', description: null, date: '2026-06-10T08:00:00.000Z', source: 'sms', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-06-10T08:00:00.000Z', syncedAt: null },
  { id: 't8', accountId: 'acc-2', type: 'expense', amount: 501, categoryId: 'shopping', merchant: 'Netflix', description: null, date: '2026-07-10T08:00:00.000Z', source: 'sms', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-07-10T08:00:00.000Z', syncedAt: null },
];

const snapshot = buildInsightsSnapshot({
  transactions,
  categories,
  accounts,
  now: new Date('2026-07-12T12:00:00.000Z'),
});

assert.equal(snapshot.duplicateSafeTransactionCount, 8);
assert.equal(snapshot.periods.monthly.expenseTotal, 1091);
assert.equal(snapshot.periods.monthly.incomeTotal, 10000);
assert.equal(snapshot.categoryBreakdown[0]?.categoryId, 'food');
assert.equal(snapshot.accountSummaries[0]?.accountId, 'acc-1');
assert.equal(snapshot.unusualSpendCandidates.length, 1);
assert.equal(snapshot.unusualSpendCandidates[0]?.transactionId, 't5');
assert.equal(snapshot.subscriptionCandidates.length, 1);
assert.equal(snapshot.subscriptionCandidates[0]?.merchant, 'Netflix');
assert.equal(snapshot.subscriptionCandidates[0]?.confidence, 'medium');
assert.equal(snapshot.sections.spendingPatterns.length, 2);
assert.equal(snapshot.sections.spendingPatterns[0]?.categoryName, 'Food');
assert.equal(snapshot.sections.habits[0]?.title, 'Balanced Timeline');
assert.equal(snapshot.sections.risk.level, 'High');
assert.equal(snapshot.sections.observations.length, 3);
assert.match(snapshot.sections.coachTip, /Food|usual range|Saving/);

const emptySnapshot = buildInsightsSnapshot({
  transactions: [],
  categories,
  accounts,
  now: new Date('2026-07-12T12:00:00.000Z'),
});

assert.equal(emptySnapshot.sections.habits.length, 0);
assert.equal(emptySnapshot.sections.risk.level, 'Low');
assert.equal(emptySnapshot.sections.observations[0], 'You spend ₹0 less on weekdays');

const localDayObservations = buildObservationsSection(
  [
    {
      id: 'tz-1',
      accountId: 'acc-1',
      type: 'expense',
      amount: 300,
      categoryId: 'food',
      merchant: 'Cafe Late',
      description: 'late dinner',
      date: new Date(2026, 6, 1, 0, 30, 0, 0).toString(),
      source: 'manual',
      smsHash: null,
      dedupeGroupId: null,
      dedupeVersion: null,
      isRecurring: false,
      tags: [],
      createdAt: '2026-07-01T00:30:00.000Z',
      syncedAt: null,
    },
    {
      id: 'tz-2',
      accountId: 'acc-1',
      type: 'expense',
      amount: 500,
      categoryId: 'food',
      merchant: 'Cafe Early',
      description: 'breakfast',
      date: new Date(2026, 6, 1, 23, 30, 0, 0).toString(),
      source: 'manual',
      smsHash: null,
      dedupeGroupId: null,
      dedupeVersion: null,
      isRecurring: false,
      tags: [],
      createdAt: '2026-07-01T23:30:00.000Z',
      syncedAt: null,
    },
  ],
  []
);

assert.equal(localDayObservations[0], 'You spend ₹800 less on weekends');

console.log('insights-engine tests: PASS');
