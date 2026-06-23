Task: Phase 2A — Insights Data Contract + Baseline Aggregation

Mode: IMPLEMENTATION

Goal:
Build the first local-only insights foundation using pure data contracts, normalization helpers, duplicate-safe filtering, and baseline aggregations.

Context:
- Parser frozen
- Dedupe frozen
- Comparator-v2 is production runtime dedupe path
- generateSMSHash is backward-compatible only
- Insights operate on already parsed + deduped transactions

Scope:
- insights-engine only
- unit tests only

Do Not Change:
- parser
- dedupe engine
- corpus
- evaluator
- DB schema
- runtime SMS flow

Create:

src/features/insights-engine/types.ts

src/features/insights-engine/normalization.ts

src/features/insights-engine/aggregation.ts

src/features/insights-engine/__tests__/aggregation.test.ts

Requirements:

1. Define InsightsTransaction:

- id
- accountId
- type
- flowType: "income" | "expense"
- amount
- categoryId
- merchant
- description
- date
- dedupeGroupId

2. normalizeTransaction(tx)

- convert date string to Date
- normalize amount
- map:
  debit -> expense
  credit -> income
- preserve:
  accountId
  categoryId
  merchant
  description
  dedupeGroupId

3. filterDuplicateTransactions(txs)

- if dedupeGroupId exists:
  keep first canonical transaction
- if dedupeGroupId missing:
  use id
- deterministic ordering

4. Aggregations

All aggregations must internally use duplicate-safe filtering.

Implement:

- calculateDailySpendTotal
- calculateWeeklySpendTotal
- calculateMonthlySpendTotal
- calculateCategoryBreakdown
- calculateAccountWiseSpend
- calculateIncomeVsExpense

Rules:

- Expense aggregations count only flowType="expense"
- IncomeVsExpense returns both totals
- Use stable date keys:
  YYYY-MM-DD
  YYYY-WW
  YYYY-MM

Tests:

- debit -> expense
- credit -> income
- invalid date handling
- amount normalization
- duplicate filtering
- daily totals
- weekly totals
- monthly totals
- category breakdown
- account breakdown
- income vs expense totals

Verification:

Run:

npm test src/features/insights-engine/__tests__/aggregation.test.ts

npm test

npm run test:research all

Return:

- files changed
- tests passed
- behavior changed yes/no
- next recommended phase