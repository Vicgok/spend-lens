import { normalizeTransaction } from '../normalization';
import { detectSubscriptionCandidates } from '../detector';
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

function main() {
  console.log('=============================================');
  console.log('      SPENDLENS DETECTOR TEST SUITE          ');
  console.log('=============================================');

  runSubscriptionDetectorTests();

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
