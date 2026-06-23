Task: Phase 2C — Unusual Spend Detector

Mode: PLAN ONLY.

Do not edit files yet.

Goal:
Detect unusually high spend locally using transaction history and baseline aggregations.

Context:
- Parser is frozen.
- Dedupe engine is frozen.
- Phase 2A and 2B complete.
- Insights operate on already parsed, normalized, and deduped transaction data.

Focus:
Plan the unusual spend detection algorithm using transaction amounts compared against historical averages or rolling averages.

Plan only:
1. Criteria for identifying unusual spend (e.g. threshold multiplier like transaction amount > 3x mean, or using standard deviation/rolling averages).
2. Unusual spend detection algorithm steps.
3. Output schema/type for the detected unusual spend (e.g. transaction, deviation, comparison baseline).
4. Required modules or file updates.
5. Algorithmic test strategy.
6. Exact next implementation prompt.

Rules:
- No AI API.
- Local-only.
- No DB schema changes unless clearly justified.
- Do not modify existing baseline aggregations or parser.
