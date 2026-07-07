import assert from 'node:assert';
import {
  categorizeTransaction,
  categorizeTransactionDetailed,
  normalizeLearnedKeyword,
} from '../categorizer';
import { DEFAULT_CATEGORIES } from '../categories';

type Fixture = {
  merchant: string | null;
  description: string | null;
  type: 'expense' | 'income';
  expectedCategoryId: string;
  expectedConfidence?: 'none' | 'low' | 'medium' | 'high';
  includesKeywords?: string[];
  excludesKeywords?: string[];
};

const productionFixtures: Fixture[] = [
  {
    merchant: 'Reliance Digital',
    description: 'electronics store purchase',
    type: 'expense',
    expectedCategoryId: 'cat_shopping',
  },
  {
    merchant: 'Swiggy',
    description: 'upi payment to swiggy order',
    type: 'expense',
    expectedCategoryId: 'cat_food',
    expectedConfidence: 'medium',
    includesKeywords: ['swiggy'],
  },
  {
    merchant: 'Employer',
    description: 'salary credited for july',
    type: 'income',
    expectedCategoryId: 'cat_income',
    expectedConfidence: 'medium',
    includesKeywords: ['salary', 'credited'],
  },
  {
    merchant: 'HDFC Bank',
    description: 'credit card bill payment',
    type: 'income',
    expectedCategoryId: 'cat_uncategorized',
    expectedConfidence: 'none',
  },
  {
    merchant: 'Axis Bank',
    description: 'imps transfer sent to savings account',
    type: 'expense',
    expectedCategoryId: 'cat_transfer',
    expectedConfidence: 'high',
    includesKeywords: ['transfer', 'imps', 'sent to'],
  },
  {
    merchant: 'Airtel',
    description: 'paid to airtel for mobile recharge',
    type: 'expense',
    expectedCategoryId: 'cat_bills',
    includesKeywords: ['airtel', 'mobile', 'recharge'],
    excludesKeywords: ['paid to'],
  },
  {
    merchant: 'Unknown Merchant',
    description: 'movie night payment',
    type: 'expense',
    expectedCategoryId: 'cat_uncategorized',
    expectedConfidence: 'none',
  },
  {
    merchant: 'Unknown Merchant',
    description: 'monthly bill payment',
    type: 'expense',
    expectedCategoryId: 'cat_uncategorized',
    expectedConfidence: 'none',
  },
  {
    merchant: 'Netflix',
    description: 'movie night streaming',
    type: 'expense',
    expectedCategoryId: 'cat_entertainment',
    includesKeywords: ['netflix'],
  },
  {
    merchant: 'Blinkit',
    description: 'upi payment to blinkit groceries',
    type: 'expense',
    expectedCategoryId: 'cat_groceries',
    expectedConfidence: 'medium',
    includesKeywords: ['blinkit'],
  },
  {
    merchant: 'BookMyShow',
    description: 'upi paid to bookmyshow movie tickets',
    type: 'expense',
    expectedCategoryId: 'cat_entertainment',
    expectedConfidence: 'high',
    includesKeywords: ['bookmyshow'],
    excludesKeywords: ['paid to'],
  },
  {
    merchant: 'IRCTC',
    description: 'upi payment to irctc train booking',
    type: 'expense',
    expectedCategoryId: 'cat_transport',
    expectedConfidence: 'high',
    includesKeywords: ['irctc', 'train'],
  },
  {
    merchant: 'Zepto Cafe',
    description: 'snacks ordered on zepto cafe',
    type: 'expense',
    expectedCategoryId: 'cat_groceries',
    expectedConfidence: 'low',
    includesKeywords: ['zepto'],
  },
  {
    merchant: 'CRED',
    description: 'credit card bill paid via cred',
    type: 'expense',
    expectedCategoryId: 'cat_uncategorized',
    expectedConfidence: 'none',
  },
  {
    merchant: 'State Bank of India',
    description: 'interest credited to account',
    type: 'income',
    expectedCategoryId: 'cat_income',
    expectedConfidence: 'high',
    includesKeywords: ['interest', 'credited'],
  },
];

for (const fixture of productionFixtures) {
  assert.equal(
    categorizeTransaction(fixture.merchant, fixture.description, fixture.type),
    fixture.expectedCategoryId,
    `${fixture.merchant ?? 'null'} should categorize as ${fixture.expectedCategoryId}`
  );

  const detailed = categorizeTransactionDetailed(fixture.merchant, fixture.description, fixture.type);
  assert.equal(
    detailed.categoryId,
    fixture.expectedCategoryId,
    `detailed category mismatch for ${fixture.merchant ?? 'null'}`
  );

  if (fixture.expectedConfidence) {
    assert.equal(
      detailed.confidence,
      fixture.expectedConfidence,
      `confidence mismatch for ${fixture.merchant ?? 'null'}`
    );
  }

  for (const keyword of fixture.includesKeywords ?? []) {
    assert.ok(
      detailed.matchedKeywords.includes(keyword),
      `expected keyword "${keyword}" for ${fixture.merchant ?? 'null'}`
    );
  }

  for (const keyword of fixture.excludesKeywords ?? []) {
    assert.ok(
      !detailed.matchedKeywords.includes(keyword),
      `unexpected keyword "${keyword}" for ${fixture.merchant ?? 'null'}`
    );
  }
}

assert.equal(
  normalizeLearnedKeyword('UPI payment to Theobroma 923114'),
  'theobroma'
);
assert.equal(
  normalizeLearnedKeyword('paid to netflix via upi ref 881199'),
  'netflix'
);
assert.equal(
  normalizeLearnedKeyword('Airtel'),
  'airtel'
);

const correctionCategories = DEFAULT_CATEGORIES.map((category) => ({
  ...category,
  keywords: [...category.keywords],
}));

const foodCategory = correctionCategories.find((category) => category.id === 'cat_food');
assert.ok(foodCategory);
foodCategory.keywords.push(normalizeLearnedKeyword('UPI payment to Theobroma 923114'));

const learnedCorrectionResult = categorizeTransactionDetailed(
  'UPI payment to Theobroma 923114',
  'brunch order via upi',
  'expense',
  correctionCategories
);
assert.equal(learnedCorrectionResult.categoryId, 'cat_food');
assert.equal(learnedCorrectionResult.confidence, 'medium');
assert.deepEqual(learnedCorrectionResult.matchedKeywords, ['theobroma']);

const uncategorizedBeforeLearning = categorizeTransactionDetailed(
  'Theobroma',
  'brunch order via upi',
  'expense'
);
assert.equal(uncategorizedBeforeLearning.categoryId, 'cat_uncategorized');
assert.equal(uncategorizedBeforeLearning.confidence, 'none');

console.log(`categorizer tests: PASS (${productionFixtures.length + 5} assertions)`);
