import assert from 'node:assert';
import { Account, Category, Transaction } from '@/types';
import {
  buildInsightsSnapshot,
  buildObservationsSection,
  detectSubscriptionCandidates,
  detectUnusualSpendCandidates,
} from '../aggregates';
import { mapInsightsSnapshotToScreenSections } from '../presenter';

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
const screenSections = mapInsightsSnapshotToScreenSections(snapshot);

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
assert.equal(snapshot.sections.habits[0]?.key, 'weekend-balance');
assert.equal(snapshot.sections.risk.level, 'High');
assert.equal(snapshot.sections.observations.moreSpendOn, 'weekdays');
assert.equal(snapshot.sections.coach.kind, 'unusual-spend');
assert.equal(screenSections.habits[0]?.title, 'Balanced Timeline');
assert.equal(screenSections.observations.length, 3);
assert.match(screenSections.coachTip, /Food|usual range|Saving/);

const emptySnapshot = buildInsightsSnapshot({
  transactions: [],
  categories,
  accounts,
  now: new Date('2026-07-12T12:00:00.000Z'),
});

assert.equal(emptySnapshot.sections.habits.length, 0);
assert.equal(emptySnapshot.sections.risk.level, 'Low');
assert.equal(emptySnapshot.sections.observations.averageTransactionValue, 0);
assert.equal(mapInsightsSnapshotToScreenSections(emptySnapshot).observations[0], 'You spend ₹0 less on weekends');

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

assert.equal(localDayObservations.moreSpendOn, 'weekdays');
assert.equal(localDayObservations.weekdayVsWeekendDelta, 800);

const belowThresholdUnusualCandidates = detectUnusualSpendCandidates(
  [
    { id: 'u1', accountId: 'acc-1', type: 'expense', amount: 100, categoryId: 'food', merchant: 'Cafe', description: null, date: '2026-05-01T10:00:00.000Z', source: 'manual', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-05-01T10:00:00.000Z', syncedAt: null },
    { id: 'u2', accountId: 'acc-1', type: 'expense', amount: 100, categoryId: 'food', merchant: 'Cafe', description: null, date: '2026-05-08T10:00:00.000Z', source: 'manual', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-05-08T10:00:00.000Z', syncedAt: null },
    { id: 'u3', accountId: 'acc-1', type: 'expense', amount: 100, categoryId: 'food', merchant: 'Cafe', description: null, date: '2026-05-15T10:00:00.000Z', source: 'manual', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-05-15T10:00:00.000Z', syncedAt: null },
    { id: 'u4', accountId: 'acc-1', type: 'expense', amount: 174, categoryId: 'food', merchant: 'Cafe', description: null, date: '2026-05-22T10:00:00.000Z', source: 'manual', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-05-22T10:00:00.000Z', syncedAt: null },
  ],
  categories
);
assert.equal(belowThresholdUnusualCandidates.length, 0);

const thresholdUnusualCandidates = detectUnusualSpendCandidates(
  [
    { id: 'u5', accountId: 'acc-1', type: 'expense', amount: 100, categoryId: 'food', merchant: 'Cafe', description: null, date: '2026-05-01T10:00:00.000Z', source: 'manual', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-05-01T10:00:00.000Z', syncedAt: null },
    { id: 'u6', accountId: 'acc-1', type: 'expense', amount: 100, categoryId: 'food', merchant: 'Cafe', description: null, date: '2026-05-08T10:00:00.000Z', source: 'manual', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-05-08T10:00:00.000Z', syncedAt: null },
    { id: 'u7', accountId: 'acc-1', type: 'expense', amount: 100, categoryId: 'food', merchant: 'Cafe', description: null, date: '2026-05-15T10:00:00.000Z', source: 'manual', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-05-15T10:00:00.000Z', syncedAt: null },
    { id: 'u8', accountId: 'acc-1', type: 'expense', amount: 175, categoryId: 'food', merchant: 'Cafe', description: null, date: '2026-05-22T10:00:00.000Z', source: 'manual', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-05-22T10:00:00.000Z', syncedAt: null },
  ],
  categories
);
assert.equal(thresholdUnusualCandidates.length, 1);
assert.equal(thresholdUnusualCandidates[0]?.transactionId, 'u8');

const sparseHistoryUnusualCandidates = detectUnusualSpendCandidates(
  [
    { id: 'u9', accountId: 'acc-1', type: 'expense', amount: 100, categoryId: 'food', merchant: 'Cafe', description: null, date: '2026-05-01T10:00:00.000Z', source: 'manual', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-05-01T10:00:00.000Z', syncedAt: null },
    { id: 'u10', accountId: 'acc-1', type: 'expense', amount: 100, categoryId: 'food', merchant: 'Cafe', description: null, date: '2026-05-08T10:00:00.000Z', source: 'manual', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-05-08T10:00:00.000Z', syncedAt: null },
    { id: 'u11', accountId: 'acc-1', type: 'expense', amount: 250, categoryId: 'food', merchant: 'Cafe', description: null, date: '2026-05-15T10:00:00.000Z', source: 'manual', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-05-15T10:00:00.000Z', syncedAt: null },
  ],
  categories
);
assert.equal(sparseHistoryUnusualCandidates.length, 0);

const insufficientCadenceSubscriptionCandidates = detectSubscriptionCandidates([
  { id: 's1', accountId: 'acc-2', type: 'expense', amount: 499, categoryId: 'shopping', merchant: 'Netflix', description: null, date: '2026-05-10T08:00:00.000Z', source: 'sms', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-05-10T08:00:00.000Z', syncedAt: null },
  { id: 's2', accountId: 'acc-2', type: 'expense', amount: 500, categoryId: 'shopping', merchant: 'Netflix', description: null, date: '2026-05-30T08:00:00.000Z', source: 'sms', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-05-30T08:00:00.000Z', syncedAt: null },
  { id: 's3', accountId: 'acc-2', type: 'expense', amount: 501, categoryId: 'shopping', merchant: 'Netflix', description: null, date: '2026-06-19T08:00:00.000Z', source: 'sms', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-06-19T08:00:00.000Z', syncedAt: null },
]);
assert.equal(insufficientCadenceSubscriptionCandidates.length, 0);

const twoOccurrenceSubscriptionCandidates = detectSubscriptionCandidates([
  { id: 's4', accountId: 'acc-2', type: 'expense', amount: 499, categoryId: 'shopping', merchant: 'Spotify', description: null, date: '2026-05-10T08:00:00.000Z', source: 'sms', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-05-10T08:00:00.000Z', syncedAt: null },
  { id: 's5', accountId: 'acc-2', type: 'expense', amount: 500, categoryId: 'shopping', merchant: 'Spotify', description: null, date: '2026-06-10T08:00:00.000Z', source: 'sms', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-06-10T08:00:00.000Z', syncedAt: null },
]);
assert.equal(twoOccurrenceSubscriptionCandidates.length, 1);
assert.equal(twoOccurrenceSubscriptionCandidates[0]?.confidence, 'medium');

const mixedSparseSnapshot = buildInsightsSnapshot({
  transactions: [
    { id: 'm1', accountId: 'acc-1', type: 'expense', amount: 220, categoryId: 'food', merchant: 'Cafe', description: null, date: '2026-07-06T10:00:00.000Z', source: 'manual', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-07-06T10:00:00.000Z', syncedAt: null },
    { id: 'm2', accountId: 'acc-2', type: 'expense', amount: 180, categoryId: 'shopping', merchant: 'Store', description: null, date: '2026-07-07T10:00:00.000Z', source: 'manual', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-07-07T10:00:00.000Z', syncedAt: null },
    { id: 'm3', accountId: 'acc-1', type: 'income', amount: 2000, categoryId: 'income', merchant: 'Employer', description: null, date: '2026-07-01T09:00:00.000Z', source: 'sms', smsHash: null, dedupeGroupId: null, dedupeVersion: null, isRecurring: false, tags: [], createdAt: '2026-07-01T09:00:00.000Z', syncedAt: null },
  ],
  categories,
  accounts,
  now: new Date('2026-07-12T12:00:00.000Z'),
});
assert.equal(mixedSparseSnapshot.categoryBreakdown.length, 2);
assert.equal(mixedSparseSnapshot.unusualSpendCandidates.length, 0);
assert.equal(mixedSparseSnapshot.subscriptionCandidates.length, 0);
assert.equal(mixedSparseSnapshot.sections.spendingPatterns.length, 2);

console.log('insights-engine tests: PASS');
