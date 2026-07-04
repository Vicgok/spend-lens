import assert from 'node:assert';
import { categorizeTransaction, categorizeTransactionDetailed } from '../categorizer';

assert.equal(
  categorizeTransaction('Reliance Digital', 'electronics store purchase', 'expense'),
  'cat_shopping'
);

assert.equal(
  categorizeTransaction('Swiggy', 'upi payment to swiggy order', 'expense'),
  'cat_food'
);

assert.equal(
  categorizeTransaction('Employer', 'salary credited for july', 'income'),
  'cat_income'
);

assert.equal(
  categorizeTransaction('HDFC Bank', 'credit card bill payment', 'income'),
  'cat_uncategorized'
);

assert.equal(
  categorizeTransaction('Axis Bank', 'imps transfer sent to savings account', 'expense'),
  'cat_transfer'
);

assert.equal(
  categorizeTransaction('Airtel', 'paid to airtel for mobile recharge', 'expense'),
  'cat_bills'
);

const transferResult = categorizeTransactionDetailed(
  'Axis Bank',
  'imps transfer sent to savings account',
  'expense'
);
assert.equal(transferResult.categoryId, 'cat_transfer');
assert.equal(transferResult.confidence, 'high');
assert.deepEqual(transferResult.matchedKeywords, ['transfer', 'imps', 'sent to']);

const ambiguousBillsResult = categorizeTransactionDetailed(
  'Airtel',
  'paid to airtel for mobile recharge',
  'expense'
);
assert.equal(ambiguousBillsResult.categoryId, 'cat_bills');
assert.ok(ambiguousBillsResult.score > 0);
assert.ok(ambiguousBillsResult.matchedKeywords.includes('airtel'));
assert.ok(!ambiguousBillsResult.matchedKeywords.includes('paid to'));

const uncategorizedResult = categorizeTransactionDetailed(
  'HDFC Bank',
  'credit card bill payment',
  'income'
);
assert.equal(uncategorizedResult.categoryId, 'cat_uncategorized');
assert.equal(uncategorizedResult.confidence, 'none');
assert.deepEqual(uncategorizedResult.matchedKeywords, []);

assert.equal(
  categorizeTransaction('Unknown Merchant', 'movie night payment', 'expense'),
  'cat_uncategorized'
);

assert.equal(
  categorizeTransaction('Unknown Merchant', 'monthly bill payment', 'expense'),
  'cat_uncategorized'
);

const lowSignalResult = categorizeTransactionDetailed(
  'Unknown Merchant',
  'movie night payment',
  'expense'
);
assert.equal(lowSignalResult.categoryId, 'cat_uncategorized');
assert.equal(lowSignalResult.confidence, 'none');
assert.deepEqual(lowSignalResult.matchedKeywords, []);

const corroboratedEntertainmentResult = categorizeTransactionDetailed(
  'Netflix',
  'movie night streaming',
  'expense'
);
assert.equal(corroboratedEntertainmentResult.categoryId, 'cat_entertainment');
assert.ok(corroboratedEntertainmentResult.matchedKeywords.includes('netflix'));

console.log('categorizer tests: PASS');
