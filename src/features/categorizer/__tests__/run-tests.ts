import assert from 'node:assert';
import { categorizeTransaction } from '../categorizer';

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

console.log('categorizer tests: PASS');
