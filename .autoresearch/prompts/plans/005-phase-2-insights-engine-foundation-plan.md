Task: Phase 2 - Insights Engine Foundation.

Mode: PLAN ONLY.

Goal:
Build the first production-safe, local-first insights foundation on top of the existing parsed, categorized, and deduped transaction ledger.

Why this is the correct next phase:
- Parser and dedupe work are already frozen and verified.
- Runtime SMS ingestion and raw-message idempotency are already in place.
- The app already has a transaction store, analytics SQL helpers, category metadata, and an `insights` screen.
- The current insights layer is UI-heavy and mixes mock/demo behavior with detector logic, so the next safe step is to establish a deterministic data layer before adding more insight logic.

Current readiness assessment:
1. Ready now
   - Stable `transactions`, `accounts`, `categories`, and `processed_sms_messages` tables exist.
   - Transaction shape already includes `accountId`, `type`, `amount`, `categoryId`, `merchant`, `date`, `source`, `dedupeGroupId`, and `isRecurring`.
   - Store already exposes transaction/account/category loading.
   - Database already exposes monthly totals, category totals, and daily totals.
2. Partially ready
   - `src/features/insights-engine/detector.ts` and `formulas.ts` exist, but they are heuristic-only and not clearly separated into reusable foundation outputs.
   - `app/(tabs)/insights.tsx` already renders an insights experience, but it contains simulation/mock data and presentation logic that should not be the source of truth.
3. Missing for a solid foundation
   - A normalized insights-domain model shared between data layer and screen.
   - Period-based aggregators for daily, weekly, monthly, category, and account summaries.
   - Deterministic subscription-candidate and unusual-spend candidate outputs with explicit thresholds.
   - Focused tests for insight computations independent of UI.

Constraints:
- No AI API.
- Local-only.
- No backend.
- No parser changes.
- No dedupe engine changes.
- No risky DB migration unless clearly needed.
- Prefer computing from existing transaction/category/account tables.

Phase 2 scope:
1. Create a reusable insights foundation module that computes deterministic summaries from local transactions.
2. Keep UI changes secondary; the data contract comes first.
3. Replace screen-local derived logic and mock-first behavior with store/database-backed outputs where practical.

Recommended implementation slices:

1. Insights domain contract
- Add a dedicated type file for:
  - period totals
  - category breakdown rows
  - account spend summary rows
  - trend points
  - unusual spend candidates
  - subscription candidates
  - final `InsightsSnapshot`

2. Data aggregation layer
- Add pure functions under `src/features/insights-engine/` for:
  - filtering eligible transactions
  - grouping by day/week/month
  - computing spend totals by category
  - computing spend totals by account
  - computing trend deltas
- Keep this layer deterministic and UI-agnostic.

3. MVP insights to support now
- Daily spend total
- Weekly spend total
- Monthly spend total
- Category spend breakdown
- Account-wise spend summary
- Duplicate-safe transaction count
- Weekly/monthly spend trend
- Unusual spend candidate detection
- Subscription candidate detection

4. Algorithmic approach
- Daily/weekly/monthly totals:
  - Use transaction `date` and sum `amount` for `expense` transactions.
- Category breakdown:
  - Group expense transactions by `categoryId`, join category metadata, compute total/count/share.
- Account summary:
  - Group transactions by `accountId`, report expense total, income total, net, and count.
- Duplicate-safe count:
  - Count persisted transactions directly; do not inspect raw SMS tables for product totals.
  - Treat the existing dedupe pipeline as the source of trust.
- Weekly/monthly trend:
  - Compare current period total with previous equivalent period.
  - Output absolute delta and percentage delta.
- Unusual spend detection:
  - Start conservative.
  - Flag expense transactions whose amount is materially above the user's recent category baseline or recent merchant baseline.
  - Suggested MVP rule: at least 3 prior comparable transactions and current amount >= 1.75x baseline median.
- Subscription candidate detection:
  - Group by merchant + rounded amount band.
  - Flag candidates with repeating cadence in the 25-35 day range and at least 2-3 occurrences.
  - Keep result as `candidate`, not confirmed recurring truth.

5. Files likely involved
- `src/features/insights-engine/types.ts` or extend `src/types/transaction.ts` carefully
- `src/features/insights-engine/aggregates.ts`
- `src/features/insights-engine/detector.ts`
- `src/features/insights-engine/formulas.ts`
- `src/stores/transaction-store.ts`
- `src/lib/database.ts`
- `app/(tabs)/insights.tsx`

6. DB/query guidance
- No schema migration is required for the Phase 2 foundation MVP.
- Prefer a mix of existing SQL helpers plus pure TypeScript aggregation.
- Only add new SQL helpers when they reduce repeated scans meaningfully.

7. Test strategy
- Add focused tests for pure insight functions, not full-screen rendering first.
- Cover:
  - category breakdown correctness
  - trend comparison correctness
  - account summary correctness
  - unusual-spend threshold behavior
  - subscription-candidate cadence detection
  - duplicate-safe counts using deduped transaction fixtures
- Keep parser/dedupe research metrics untouched.

8. Risks and guardrails
- Do not let the insights screen depend on mock transactions for production behavior.
- Avoid overclaiming with behavioral labels; use "candidate" or "possible" for heuristic detections.
- Do not infer income cycles or subscriptions when there is insufficient history.
- Avoid coupling insight logic to onboarding/account-balance UI.

9. Exact next implementation prompt
Implement Phase 2 - Insights Engine Foundation.

Goal:
Create a deterministic local insights data layer and wire the insights screen to it for MVP metrics.

Do:
- add a reusable insights snapshot builder under `src/features/insights-engine/`
- compute daily/weekly/monthly expense totals
- compute category spend breakdown
- compute account-wise spend summary
- compute current-vs-previous trend deltas
- add conservative unusual-spend candidate detection
- add conservative subscription-candidate detection
- expose the snapshot through `transaction-store`
- update `app/(tabs)/insights.tsx` to consume the real snapshot instead of screen-local mock-driven derivation where possible
- add focused unit tests for the new pure functions

Do not:
- change parser logic
- change dedupe engine logic
- add backend/API dependencies
- add risky schema migrations
- alter research metric formulas

Success criteria:
- Insights are computed from persisted local data.
- The data layer is reusable outside the current screen.
- Heuristic outputs are labeled conservatively.
- Tests cover the new aggregation and detector rules.
