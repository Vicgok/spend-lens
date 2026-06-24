import { normalizeTransaction } from '../normalization';
import {
  detectSubscriptionCandidates,
  detectUnusualSpendCandidates,
  generateAllInsights,
} from '../detector';
import { InsightsTransaction } from '../types';
import { Category, Transaction } from '../../../types';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

function runSubscriptionDetectorTests() {
  console.log('\n--- Running Subscription Candidate Detector Unit Tests ---');

  // Test Case 1: Monthly subscription exact 30 days => detected
  const txs1: InsightsTransaction[] = [
    normalizeTransaction({ id: '1', type: 'debit', amount: 649, date: '2026-04-01T10:00:00Z', merchant: 'Netflix' }),
    normalizeTransaction({ id: '2', type: 'debit', amount: 649, date: '2026-05-01T10:00:00Z', merchant: 'Netflix' }),
    normalizeTransaction({ id: '3', type: 'debit', amount: 649, date: '2026-05-31T10:00:00Z', merchant: 'Netflix' }), // 30 days later
  ];
  const res1 = detectSubscriptionCandidates(txs1);
  assert(res1.length === 1, 'TC1: Netflix detected as subscription candidate');
  if (res1[0]) {
    assert(res1[0].frequencyType === 'monthly', 'TC1: Netflix frequency is monthly');
    assert(res1[0].avgAmount === 649, 'TC1: Netflix average amount is 649');
    assert(res1[0].confidence === 'likely', 'TC1: 3 occurrences => likely confidence');
    assert(res1[0].transactionIds.length === 3, 'TC1: references all 3 transactions');
  }

  // Test Case 2: Monthly amount variation within 10% => detected
  const txs2: InsightsTransaction[] = [
    normalizeTransaction({ id: '1', type: 'debit', amount: 1000, date: '2026-04-01T10:00:00Z', merchant: 'Gym' }),
    normalizeTransaction({ id: '2', type: 'debit', amount: 1050, date: '2026-05-01T10:00:00Z', merchant: 'Gym' }), // +5%
  ];
  const res2 = detectSubscriptionCandidates(txs2);
  assert(res2.length === 1, 'TC2: Gym detected with <10% amount variation');
  if (res2[0]) {
    assert(res2[0].confidence === 'possible', 'TC2: 2 occurrences => possible confidence');
    assert(res2[0].avgAmount === 1025, 'TC2: average amount calculated correctly');
  }

  // Test Case 3: Amount variation >10% => rejected
  const txs3: InsightsTransaction[] = [
    normalizeTransaction({ id: '1', type: 'debit', amount: 1000, date: '2026-04-01T10:00:00Z', merchant: 'AWS' }),
    normalizeTransaction({ id: '2', type: 'debit', amount: 1300, date: '2026-05-01T10:00:00Z', merchant: 'AWS' }), // average 1150, dev ~13% (reject)
  ];
  const res3 = detectSubscriptionCandidates(txs3);
  assert(res3.length === 0, 'TC3: AWS with >10% amount variation rejected');

  // Test Case 4: Weekly 7-day subscription => detected
  const txs4: InsightsTransaction[] = [
    normalizeTransaction({ id: '1', type: 'debit', amount: 199, date: '2026-06-01T10:00:00Z', merchant: 'WeeklySaaS' }),
    normalizeTransaction({ id: '2', type: 'debit', amount: 199, date: '2026-06-08T10:00:00Z', merchant: 'WeeklySaaS' }), // 7 days
    normalizeTransaction({ id: '3', type: 'debit', amount: 199, date: '2026-06-15T10:00:00Z', merchant: 'WeeklySaaS' }), // 7 days
  ];
  const res4 = detectSubscriptionCandidates(txs4);
  assert(res4.length === 1, 'TC4: WeeklySaaS detected');
  if (res4[0]) {
    assert(res4[0].frequencyType === 'weekly', 'TC4: Frequency is weekly');
    assert(res4[0].intervalDays === 7, 'TC4: average interval is 7 days');
  }

  // Test Case 5: Random food orders => rejected
  const txs5: InsightsTransaction[] = [
    normalizeTransaction({ id: '1', type: 'debit', amount: 350, date: '2026-06-01T10:00:00Z', merchant: 'Zomato' }),
    normalizeTransaction({ id: '2', type: 'debit', amount: 320, date: '2026-06-03T10:00:00Z', merchant: 'Zomato' }), // 2 days
    normalizeTransaction({ id: '3', type: 'debit', amount: 380, date: '2026-06-12T10:00:00Z', merchant: 'Zomato' }), // 9 days
  ];
  const res5 = detectSubscriptionCandidates(txs5);
  assert(res5.length === 0, 'TC5: Random orders with irregular intervals rejected');

  // Test Case 6: Single transaction => rejected
  const txs6: InsightsTransaction[] = [
    normalizeTransaction({ id: '1', type: 'debit', amount: 2000, date: '2026-06-01T10:00:00Z', merchant: 'OneTime' }),
  ];
  const res6 = detectSubscriptionCandidates(txs6);
  assert(res6.length === 0, 'TC6: Single transaction rejected');

  // Test Case 7: Credit/income transactions ignored
  const txs7: InsightsTransaction[] = [
    normalizeTransaction({ id: '1', type: 'credit', amount: 50000, date: '2026-04-01T10:00:00Z', merchant: 'SalaryEmployer' }),
    normalizeTransaction({ id: '2', type: 'credit', amount: 50000, date: '2026-05-01T10:00:00Z', merchant: 'SalaryEmployer' }),
  ];
  const res7 = detectSubscriptionCandidates(txs7);
  assert(res7.length === 0, 'TC7: Income / credits are ignored');

  // Test Case 8: Missing merchant ignored
  const txs8: InsightsTransaction[] = [
    normalizeTransaction({ id: '1', type: 'debit', amount: 100, date: '2026-04-01T10:00:00Z', merchant: null }),
    normalizeTransaction({ id: '2', type: 'debit', amount: 100, date: '2026-05-01T10:00:00Z', merchant: null }),
  ];
  const res8 = detectSubscriptionCandidates(txs8);
  assert(res8.length === 0, 'TC8: Missing merchant ignored');
}

function runUnusualSpendDetectorTests() {
  console.log('\n--- Running Unusual Spend Detector Unit Tests ---');

  const txs1: InsightsTransaction[] = [
    normalizeTransaction({ id: 'u1', type: 'debit', amount: 500, date: '2026-04-01T10:00:00Z', merchant: 'Amazon' }),
    normalizeTransaction({ id: 'u2', type: 'debit', amount: 520, date: '2026-04-10T10:00:00Z', merchant: 'Amazon' }),
    normalizeTransaction({ id: 'u3', type: 'debit', amount: 510, date: '2026-04-20T10:00:00Z', merchant: 'Amazon' }),
    normalizeTransaction({ id: 'u4', type: 'debit', amount: 1600, date: '2026-05-01T10:00:00Z', merchant: 'Amazon' }),
  ];
  const res1 = detectUnusualSpendCandidates(txs1);
  assert(res1.length === 1, 'UTC1: Stable-history merchant spike detected');
  if (res1[0]) {
    assert(res1[0].transactionId === 'u4', 'UTC1: Flags the spike transaction');
    assert(res1[0].baselineCount === 3, 'UTC1: Uses three prior transactions as baseline');
    assert(Math.round(res1[0].baselineMeanAmount) === 510, 'UTC1: Baseline mean computed from prior history');
    assert(res1[0].severity === 'high', 'UTC1: Large spike escalates to high severity');
  }

  const txs2: InsightsTransaction[] = [
    normalizeTransaction({ id: 'u1', type: 'debit', amount: 500, date: '2026-04-01T10:00:00Z', merchant: 'Gym' }),
    normalizeTransaction({ id: 'u2', type: 'debit', amount: 520, date: '2026-04-10T10:00:00Z', merchant: 'Gym' }),
    normalizeTransaction({ id: 'u3', type: 'debit', amount: 1600, date: '2026-05-01T10:00:00Z', merchant: 'Gym' }),
  ];
  const res2 = detectUnusualSpendCandidates(txs2);
  assert(res2.length === 0, 'UTC2: Insufficient merchant history rejected');

  const txs3: InsightsTransaction[] = [
    normalizeTransaction({ id: 'u1', type: 'debit', amount: 500, date: '2026-04-01T10:00:00Z', merchant: 'Apple' }),
    normalizeTransaction({ id: 'u2', type: 'debit', amount: 520, date: '2026-04-10T10:00:00Z', merchant: 'Apple' }),
    normalizeTransaction({ id: 'u3', type: 'debit', amount: 510, date: '2026-04-20T10:00:00Z', merchant: 'Apple' }),
    normalizeTransaction({ id: 'u4', type: 'debit', amount: 900, date: '2026-05-01T10:00:00Z', merchant: 'Apple' }),
  ];
  const res3 = detectUnusualSpendCandidates(txs3);
  assert(res3.length === 0, 'UTC3: Mild increase below thresholds rejected');

  const txs4: InsightsTransaction[] = [
    normalizeTransaction({ id: 'u1', type: 'credit', amount: 500, date: '2026-04-01T10:00:00Z', merchant: 'Employer' }),
    normalizeTransaction({ id: 'u2', type: 'credit', amount: 520, date: '2026-04-10T10:00:00Z', merchant: 'Employer' }),
    normalizeTransaction({ id: 'u3', type: 'credit', amount: 510, date: '2026-04-20T10:00:00Z', merchant: 'Employer' }),
    normalizeTransaction({ id: 'u4', type: 'credit', amount: 1600, date: '2026-05-01T10:00:00Z', merchant: 'Employer' }),
  ];
  const res4 = detectUnusualSpendCandidates(txs4);
  assert(res4.length === 0, 'UTC4: Income transactions ignored');

  const txs5: InsightsTransaction[] = [
    normalizeTransaction({ id: 'u1', type: 'debit', amount: 500, date: '2026-04-01T10:00:00Z', merchant: null }),
    normalizeTransaction({ id: 'u2', type: 'debit', amount: 520, date: '2026-04-10T10:00:00Z', merchant: null }),
    normalizeTransaction({ id: 'u3', type: 'debit', amount: 510, date: '2026-04-20T10:00:00Z', merchant: null }),
    normalizeTransaction({ id: 'u4', type: 'debit', amount: 1600, date: '2026-05-01T10:00:00Z', merchant: null }),
  ];
  const res5 = detectUnusualSpendCandidates(txs5);
  assert(res5.length === 0, 'UTC5: Missing merchant ignored');

  const txs6: InsightsTransaction[] = [
    normalizeTransaction({ id: 'u1', type: 'debit', amount: 500, date: '2026-04-01T10:00:00Z', merchant: 'Flipkart' }),
    normalizeTransaction({ id: 'u2', type: 'debit', amount: 520, date: '2026-04-10T10:00:00Z', merchant: 'Flipkart' }),
    normalizeTransaction({ id: 'u3', type: 'debit', amount: 510, date: '2026-04-20T10:00:00Z', merchant: 'Flipkart' }),
    normalizeTransaction({ id: 'u4', type: 'debit', amount: 1400, date: '2026-05-01T10:00:00Z', merchant: 'Flipkart' }),
  ];
  const res6 = detectUnusualSpendCandidates(txs6);
  assert(res6.length === 1, 'UTC6: Prior-only baseline does not include the candidate transaction in its own baseline');
  if (res6[0]) {
    assert(res6[0].transactionId === 'u4', 'UTC6: Candidate is evaluated only against earlier merchant history');
  }

  const txs7: InsightsTransaction[] = [
    normalizeTransaction({ id: 'u1', type: 'debit', amount: 600, date: '2026-04-01T10:00:00Z', merchant: 'Rent' }),
    normalizeTransaction({ id: 'u2', type: 'debit', amount: 600, date: '2026-04-10T10:00:00Z', merchant: 'Rent' }),
    normalizeTransaction({ id: 'u3', type: 'debit', amount: 600, date: '2026-04-20T10:00:00Z', merchant: 'Rent' }),
    normalizeTransaction({ id: 'u4', type: 'debit', amount: 1600, date: '2026-05-01T10:00:00Z', merchant: 'Rent' }),
  ];
  const res7 = detectUnusualSpendCandidates(txs7);
  assert(res7.length === 1, 'UTC7: Zero-stddev baseline can still detect a spike');
  if (res7[0]) {
    assert(res7[0].zScore === null, 'UTC7: Zero-stddev baseline yields null z-score');
  }

  const txs8: InsightsTransaction[] = [
    normalizeTransaction({ id: 'u1', type: 'debit', amount: 500, date: '2026-04-01T10:00:00Z', merchant: 'StoreA' }),
    normalizeTransaction({ id: 'u2', type: 'debit', amount: 510, date: '2026-04-02T10:00:00Z', merchant: 'StoreA' }),
    normalizeTransaction({ id: 'u3', type: 'debit', amount: 505, date: '2026-04-03T10:00:00Z', merchant: 'StoreA' }),
    normalizeTransaction({ id: 'u4', type: 'debit', amount: 1600, date: '2026-05-03T10:00:00Z', merchant: 'StoreA' }),
    normalizeTransaction({ id: 'u5', type: 'debit', amount: 300, date: '2026-04-01T10:00:00Z', merchant: 'StoreB' }),
    normalizeTransaction({ id: 'u6', type: 'debit', amount: 320, date: '2026-04-02T10:00:00Z', merchant: 'StoreB' }),
    normalizeTransaction({ id: 'u7', type: 'debit', amount: 310, date: '2026-04-03T10:00:00Z', merchant: 'StoreB' }),
    normalizeTransaction({ id: 'u8', type: 'debit', amount: 1200, date: '2026-05-05T10:00:00Z', merchant: 'StoreB' }),
  ];
  const res8 = detectUnusualSpendCandidates(txs8);
  assert(res8.length === 2, 'UTC8: Multiple merchants handled independently');
  if (res8[0] && res8[1]) {
    assert(res8[0].transactionId === 'u8', 'UTC8: Results sorted newest first');
    assert(res8[1].transactionId === 'u4', 'UTC8: Older result follows');
  }

  const txs9: InsightsTransaction[] = [
    normalizeTransaction({ id: 'u1', type: 'debit', amount: 400, date: '2026-04-01T10:00:00Z', merchant: 'Cafe' }),
    normalizeTransaction({ id: 'u2', type: 'debit', amount: 420, date: '2026-04-10T10:00:00Z', merchant: 'Cafe' }),
    normalizeTransaction({ id: 'u3', type: 'debit', amount: 410, date: '2026-04-20T10:00:00Z', merchant: 'Cafe' }),
    normalizeTransaction({ id: 'u4', type: 'debit', amount: 1600, date: '2026-05-01T10:00:00Z', merchant: 'Cafe', dedupeGroupId: 'dup-1' }),
    normalizeTransaction({ id: 'u5', type: 'debit', amount: 1600, date: '2026-05-01T10:00:00Z', merchant: 'Cafe', dedupeGroupId: 'dup-1' }),
  ];
  const res9 = detectUnusualSpendCandidates(txs9);
  assert(res9.length === 1, 'UTC9: Dedupe filtering prevents duplicate-derived false positives');
}

function buildTransaction(partial: Partial<Transaction> & Pick<Transaction, 'id' | 'type' | 'amount' | 'date'>): Transaction {
  return {
    id: partial.id,
    accountId: partial.accountId ?? 'acc-1',
    type: partial.type,
    amount: partial.amount,
    categoryId: partial.categoryId ?? null,
    merchant: partial.merchant ?? null,
    description: partial.description ?? null,
    date: partial.date,
    source: partial.source ?? 'manual',
    smsHash: partial.smsHash ?? null,
    isRecurring: partial.isRecurring ?? false,
    tags: partial.tags ?? [],
    createdAt: partial.createdAt ?? partial.date,
    syncedAt: partial.syncedAt ?? null,
    dedupeGroupId: partial.dedupeGroupId ?? null,
  };
}

function runInsightsComposerTests() {
  console.log('\n--- Running Insights Composer Unit Tests ---');

  const categories: Category[] = [];

  const unusualTxs: Transaction[] = [
    buildTransaction({ id: 'c1', type: 'expense', amount: 500, merchant: 'Amazon', date: '2026-04-01T10:00:00Z' }),
    buildTransaction({ id: 'c2', type: 'expense', amount: 520, merchant: 'Amazon', date: '2026-04-10T10:00:00Z' }),
    buildTransaction({ id: 'c3', type: 'expense', amount: 510, merchant: 'Amazon', date: '2026-04-20T10:00:00Z' }),
    buildTransaction({ id: 'c4', type: 'expense', amount: 1600, merchant: 'Amazon', date: '2026-05-01T10:00:00Z' }),
  ];
  const composer1 = generateAllInsights(unusualTxs, categories, 0);
  const unusualCard = composer1.find((card) => card.type === 'unusual_spend');
  assert(Boolean(unusualCard), 'CT1: unusual spend candidate becomes InsightCardData');
  if (unusualCard) {
    assert(unusualCard.title === 'Unusual Spending Detected', 'CT1: unusual spend card has expected title');
    assert(unusualCard.priority === 'high', 'CT1: unusual spend severity maps to card priority');
  }

  const subscriptionTxs: Transaction[] = [
    buildTransaction({ id: 's1', type: 'expense', amount: 649, merchant: 'Netflix', date: '2026-04-01T10:00:00Z', isRecurring: true }),
    buildTransaction({ id: 's2', type: 'expense', amount: 649, merchant: 'Netflix', date: '2026-05-01T10:00:00Z', isRecurring: true }),
    buildTransaction({ id: 's3', type: 'expense', amount: 649, merchant: 'Netflix', date: '2026-05-31T10:00:00Z', isRecurring: true }),
  ];
  const composer2 = generateAllInsights(subscriptionTxs, categories, 0);
  const structuredSubCard = composer2.find((card) => card.type === 'subscription');
  assert(Boolean(structuredSubCard), 'CT2: subscription candidate becomes InsightCardData');
  if (structuredSubCard) {
    assert(
      structuredSubCard.title === 'Recurring Subscription Detected',
      'CT2: structured subscription uses composer mapping'
    );
  }

  const overlappingSubscriptionTxs: Transaction[] = [
    buildTransaction({ id: 'o1', type: 'expense', amount: 129, merchant: 'Spotify', description: 'Spotify Premium', date: '2026-04-01T10:00:00Z', isRecurring: true }),
    buildTransaction({ id: 'o2', type: 'expense', amount: 129, merchant: 'Spotify', description: 'Spotify Premium', date: '2026-05-01T10:00:00Z', isRecurring: true }),
    buildTransaction({ id: 'o3', type: 'expense', amount: 129, merchant: 'Spotify', description: 'Spotify Premium', date: '2026-05-31T10:00:00Z', isRecurring: true }),
  ];
  const composer3 = generateAllInsights(overlappingSubscriptionTxs, categories, 0);
  assert(
    composer3.some((card) => card.title === 'Recurring Subscription Detected'),
    'CT3: structured subscription card is present when overlap exists'
  );
  assert(
    !composer3.some((card) => card.title === 'Subscription Burden'),
    'CT3: structured subscription suppresses overlapping heuristic subscription burden'
  );

  const mixedTxs: Transaction[] = [
    buildTransaction({ id: 'm1', type: 'expense', amount: 220, merchant: 'Cafe', date: '2026-06-01T10:00:00Z' }),
    buildTransaction({ id: 'm2', type: 'expense', amount: 240, merchant: 'Cafe', date: '2026-06-03T10:00:00Z' }),
    buildTransaction({ id: 'm3', type: 'expense', amount: 260, merchant: 'Cafe', date: '2026-06-05T10:00:00Z' }),
    buildTransaction({ id: 'm4', type: 'expense', amount: 180, merchant: 'Snacks', date: '2026-06-07T10:00:00Z' }),
    buildTransaction({ id: 'm5', type: 'income', amount: 50000, merchant: 'Employer', date: '2026-06-01T10:00:00Z' }),
    buildTransaction({ id: 'm6', type: 'expense', amount: 43000, merchant: 'Rent', date: '2026-06-10T10:00:00Z' }),
  ];
  const composer4 = generateAllInsights(mixedTxs, categories, 0);
  assert(
    composer4.some((card) => card.type === 'money_leak'),
    'CT4: non-overlapping heuristic money leak insight remains'
  );
  assert(
    composer4.some((card) => card.type === 'salary_risk'),
    'CT4: non-overlapping heuristic salary risk insight remains'
  );

  const composer5 = generateAllInsights([], categories, 0);
  assert(Array.isArray(composer5) && composer5.length === 0, 'CT5: empty transaction list returns stable empty result');
}

function main() {
  console.log('=============================================');
  console.log('      SPENDLENS DETECTOR TEST SUITE          ');
  console.log('=============================================');

  runSubscriptionDetectorTests();
  runUnusualSpendDetectorTests();
  runInsightsComposerTests();

  console.log('\n=============================================');
  console.log(`TEST RUN SUMMARY:`);
  console.log(`  PASSED: ${passedTests}`);
  console.log(`  FAILED: ${failedTests}`);
  console.log('=============================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
