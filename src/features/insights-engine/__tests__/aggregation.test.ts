import { normalizeTransaction, filterDuplicateTransactions } from '../normalization';
import {
  calculateDailySpendTotal,
  calculateWeeklySpendTotal,
  calculateMonthlySpendTotal,
  calculateCategoryBreakdown,
  calculateAccountWiseSpend,
  calculateIncomeVsExpense,
} from '../aggregation';
import { InsightsTransaction } from '../types';

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

function runNormalizationTests() {
  console.log('\n--- Running Normalization Unit Tests ---');

  // Test amount normalization
  const tx1 = normalizeTransaction({ amount: -1500.5, date: '2026-06-24T12:00:00Z', type: 'debit' });
  assert(tx1.amount === 1500.5, 'Amount: converts negative to positive absolute');

  const tx2 = normalizeTransaction({ amount: 'invalid-amount', type: 'debit' });
  assert(tx2.amount === 0, 'Amount: invalid number defaults to 0');

  // Test date normalization
  const tx3 = normalizeTransaction({ date: 'invalid-date', type: 'debit' });
  assert(tx3.date instanceof Date && !isNaN(tx3.date.getTime()), 'Date: invalid date fallbacks to current Date');

  // Test type/flowType normalization
  const tx4 = normalizeTransaction({ type: 'debit' });
  assert(tx4.flowType === 'expense', 'Type: debit maps to expense');

  const tx5 = normalizeTransaction({ type: 'credit' });
  assert(tx5.flowType === 'income', 'Type: credit maps to income');

  const tx6 = normalizeTransaction({ type: 'expense' });
  assert(tx6.flowType === 'expense', 'Type: expense maps to expense');

  const tx7 = normalizeTransaction({ type: 'income' });
  assert(tx7.flowType === 'income', 'Type: income maps to income');

  const tx8 = normalizeTransaction({ type: 'invalid' });
  assert(tx8.flowType === 'expense', 'Type: invalid defaults to expense');

  // Test merchant normalization
  const tx9 = normalizeTransaction({ merchant: '  Zomato  ' });
  assert(tx9.merchant === 'Zomato', 'Merchant: trims whitespaces');

  const tx10 = normalizeTransaction({ merchant: '   ' });
  assert(tx10.merchant === null, 'Merchant: empty/whitespace string nullified');

  // Test category normalization
  const tx11 = normalizeTransaction({ categoryId: '   ' });
  assert(tx11.categoryId === null, 'Category: empty/whitespace string nullified');

  // Test account ID normalization
  const tx12 = normalizeTransaction({ accountId: '   ' });
  assert(tx12.accountId === 'unknown-account', 'Account ID: empty/whitespace string fallbacks to unknown-account');

  // Test dedupeGroupId normalization
  const tx13 = normalizeTransaction({ dedupeGroupId: '   ' });
  assert(tx13.dedupeGroupId === null, 'DedupeGroupId: empty/whitespace string nullified');
}

function runDeduplicationTests() {
  console.log('\n--- Running Deduplication Unit Tests ---');

  const list: InsightsTransaction[] = [
    normalizeTransaction({ id: '2', dedupeGroupId: 'groupA', amount: 100, date: '2026-06-24T10:00:00Z' }),
    normalizeTransaction({ id: '1', dedupeGroupId: 'groupA', amount: 100, date: '2026-06-24T10:00:00Z' }),
    normalizeTransaction({ id: '3', dedupeGroupId: null, amount: 200, date: '2026-06-24T11:00:00Z' }),
    normalizeTransaction({ id: '4', dedupeGroupId: 'groupB', amount: 300, date: '2026-06-24T12:00:00Z' }),
  ];

  const deduped = filterDuplicateTransactions(list);
  assert(deduped.length === 3, 'Deduplication: filters duplicate group items');
  assert(deduped[0].id === '1', 'Deduplication: deterministic sort orders id "1" before "2"');
  assert(deduped[1].id === '3', 'Deduplication: preserves missing/null dedupeGroupId items');
  assert(deduped[2].id === '4', 'Deduplication: preserves other group items');
}

function runAggregationTests() {
  console.log('\n--- Running Aggregation Unit Tests ---');

  // Prepare a robust set of transactions (some duplicate records)
  const txs: InsightsTransaction[] = [
    // 2026-06-24 (Wednesday, Week 26 of 2026)
    normalizeTransaction({ id: '1', type: 'debit', amount: 100, date: '2026-06-24T10:00:00Z', categoryId: 'cat1', accountId: 'accA' }),
    normalizeTransaction({ id: '2', type: 'debit', amount: 50, date: '2026-06-24T15:00:00Z', categoryId: 'cat1', accountId: 'accA' }),
    // Duplicate transaction with same dedupeGroupId (should be filtered internally)
    normalizeTransaction({ id: '2-dup', type: 'debit', amount: 50, date: '2026-06-24T15:00:00Z', categoryId: 'cat1', accountId: 'accA', dedupeGroupId: 'dup-group' }),
    normalizeTransaction({ id: '2-dup-canonical', type: 'debit', amount: 50, date: '2026-06-24T15:00:00Z', categoryId: 'cat1', accountId: 'accA', dedupeGroupId: 'dup-group' }),
    // 2026-06-25 (Thursday, Week 26 of 2026)
    normalizeTransaction({ id: '3', type: 'debit', amount: 200, date: '2026-06-25T11:00:00Z', categoryId: 'cat2', accountId: 'accB' }),
    // 2026-06-18 (Thursday, Week 25 of 2026)
    normalizeTransaction({ id: '4', type: 'debit', amount: 120, date: '2026-06-18T11:00:00Z', categoryId: 'cat1', accountId: 'accB' }),
    // Income (should be ignored in spend calculations)
    normalizeTransaction({ id: '5', type: 'credit', amount: 1000, date: '2026-06-24T09:00:00Z', categoryId: 'cat1', accountId: 'accA' }),
  ];

  // 1. Daily spend
  const daily = calculateDailySpendTotal(txs);
  assert(daily['2026-06-24'] === 200, 'Daily: correctly aggregates 2026-06-24 spend including dedupe (100 + 50 + 50)');
  assert(daily['2026-06-25'] === 200, 'Daily: correctly aggregates 2026-06-25 spend (200)');
  assert(daily['2026-06-18'] === 120, 'Daily: correctly aggregates 2026-06-18 spend (120)');

  // 2. Weekly spend
  const weekly = calculateWeeklySpendTotal(txs);
  assert(weekly['2026-26'] === 400, 'Weekly: aggregates correctly for week 26 of 2026');
  assert(weekly['2026-25'] === 120, 'Weekly: aggregates correctly for week 25 of 2026');

  // 3. Monthly spend
  const monthly = calculateMonthlySpendTotal(txs);
  assert(monthly['2026-06'] === 520, 'Monthly: aggregates correctly for June 2026');

  // 4. Category breakdown
  const category = calculateCategoryBreakdown(txs);
  assert(category['cat1'] === 320, 'Category: cat1 aggregate is correct');
  assert(category['cat2'] === 200, 'Category: cat2 aggregate is correct');

  // 5. Account-wise spend
  const account = calculateAccountWiseSpend(txs);
  assert(account['accA'] === 200, 'Account: accA aggregate is correct');
  assert(account['accB'] === 320, 'Account: accB aggregate is correct');

  // 6. Income vs Expense
  const ie = calculateIncomeVsExpense(txs);
  assert(ie.income === 1000, 'IncomeVsExpense: income matches');
  assert(ie.expense === 520, 'IncomeVsExpense: expense matches');
}

function main() {
  console.log('=============================================');
  console.log('      SPENDLENS AGGREGATION TEST SUITE       ');
  console.log('=============================================');

  runNormalizationTests();
  runDeduplicationTests();
  runAggregationTests();

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
