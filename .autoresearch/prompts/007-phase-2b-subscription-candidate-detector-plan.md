Task: Phase 2B — Subscription Candidate Detector

Mode: IMPLEMENTATION

Goal:
Detect recurring subscription candidates locally from normalized InsightsTransaction history.

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
- external API / AI

Update:
- src/features/insights-engine/types.ts
- src/features/insights-engine/detector.ts
- src/features/insights-engine/__tests__/detector.test.ts

Requirements:

1. Add SubscriptionCandidate type:

fields:
- merchant
- normalizedMerchant
- avgAmount
- intervalDays
- frequencyType: "weekly" | "monthly"
- occurrencesCount
- confidence: "possible" | "likely"
- lastDate
- transactionIds

2. Detection rules:
- use only flowType="expense"
- skip missing merchant
- group by normalized merchant
- minimum 2 occurrences
- 2 occurrences => confidence="possible"
- 3+ occurrences => confidence="likely"
- weekly interval = 6 to 8 days
- monthly interval = 27 to 33 days
- amount variance <= 10%
- sort output by lastDate descending

3. Amount variance:
Use max deviation from average:
abs(amount - avgAmount) / avgAmount <= 0.10

4. Interval logic:
- compute adjacent day differences
- all intervals must fit same frequency window
- if not weekly/monthly, reject

5. Tests:
- monthly subscription exact 30 days => detected
- monthly amount variation within 10% => detected
- amount variation >10% => rejected
- weekly 7-day subscription => detected
- random food orders => rejected
- single transaction => rejected
- 2 occurrences => possible
- 3 occurrences => likely
- credit/income transactions ignored
- missing merchant ignored

Run:
npm test src/features/insights-engine/__tests__/detector.test.ts
npm test
npm run test:research all

Return:
- files changed
- tests passed
- behavior changed yes/no
- next recommended phase

Autoresearch memory update:
After successful implementation, update:

.autoresearch/state.json
Set:
phase = "phase-2c-unusual-spend-detector"
status = "ready"
mode = "plan-only"
attempt = 1
lastDecision = "KEEP"
nextPriority = "unusual-spend-detector"

.autoresearch/current-task.md
Update to:
Phase 2C — Unusual Spend Detector

Goal:
Detect unusually high spend locally using transaction history and baseline aggregations.

.autoresearch/metricplan -history.json
Append:
{
  "phase": "phase-2b-subscription-candidate-detector",
  "status": "KEEP",
  "decision": "KEEP",
  "sourceOfTruth": "research-loop/test-suite/reports/latest-metrics.json",
  "notes": "Phase 2B completed. Subscription candidate detector implemented using local recurring merchant pattern detection."
}

.autoresearch/decision-log.md
Append:
## Phase 2B — Subscription Candidate Detector

Decision: KEEP

Reason:
Local subscription candidate detection was implemented and tests passed.

Next phase:
Phase 2C — Unusual Spend Detector

.autoresearch/prompts/
Create:
008-phase-2c-unusual-spend-detector-plan.md