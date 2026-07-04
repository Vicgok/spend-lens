# Decision Log

## Phase 0 - Machine-Readable Test Outputs

Decision: KEEP

Reason:
The test-suite now emits normalized latest-metrics.json artifacts for parser, dedupe, and the combined all run.

Source of truth:
research-loop/test-suite/reports/latest-metrics.json

Commands verified:

- npm run test:research parser: PASS
- npm run test:research dedupe: PASS
- npm run test:research all: PASS
- npm test: PASS

Behavior changed:
Yes. Test-suite reporting changed to support orchestration.

Code behavior changed:
No app/runtime/parser/dedupe engine behavior should have changed.

Notes:
The built-in patch tool was blocked by the Windows sandbox wrapper, so escalated file writes were used for test-suite-only changes.

Next phase:
Phase 1A - SMS Reader Comparator-V2 Minimal Runtime Integration

## Phase 1A - SMS Reader Comparator-V2 Minimal Runtime Integration

Decision: KEEP

Reason:
The app runtime now uses comparator-v2-compatible persisted duplicate checks in both historical sync and live SMS ingest before insert, while preserving sms_hash as a temporary raw-message guard.

Source of truth:
research-loop/test-suite/reports/latest-metrics.json

Commands verified:

- npm test: PASS
- npm run test:research all: PASS

Behavior changed:
Yes. Runtime SMS dedupe behavior changed in app ingest paths.

Code behavior changed:
Yes. Historical sync and live SMS ingest now check persisted recent SMS transactions with comparator-v2 before insert.

Notes:
No parser, dedupe engine, evaluator, corpus, or DB schema changes were made.

Next phase:
Phase 1B - Runtime Dedupe Hardening

Next priority:
processed SMS/message idempotency and restart/rescan safety

## Phase 1B - Runtime Dedupe Hardening

Decision: KEEP

Reason:
Raw SMS idempotency is now persisted separately from transaction rows, while comparator-v2 remains the transaction-level duplicate decision.

Source of truth:
research-loop/test-suite/reports/latest-metrics.json

Commands verified:

- npm test: PASS
- npm run test:research all: PASS

Behavior changed:
Yes. Runtime SMS persistence now records processed raw SMS for insert and duplicate-skip outcomes.

Code behavior changed:
Yes. Historical sync and live SMS ingest now mark processed raw SMS separately, and new SMS transaction rows store message-level sms_hash values.

Notes:
Migration-safe schema addition only. Existing transaction data was preserved.

Next phase:
Phase 1C - optional backfill / runtime observability hardening if needed

## Phase 1C - Runtime Observability / Backfill Audit

Decision: KEEP / NO-OP

Reason:
No Phase 1C implementation is needed now.

Findings:
- processed_sms_messages ledger exists.
- Comparator-v2 is runtime transaction dedupe path.
- Duplicate skip logs already exist for live and historical flows.
- Backfill is not required for current runtime correctness.
- No files changed.

Next phase:
Phase 2 - Insights Engine Foundation

## Phase 2 - Insights Engine Foundation

Decision: KEEP

Reason:
Implemented a deterministic, local-first insights snapshot layer on top of persisted transactions without changing parser or dedupe behavior.

Source of truth:
src/features/insights-engine/aggregates.ts

Commands verified:

- npm run check: PASS
- npm test: PASS
- npm run test:insights: PASS

Behavior changed:
Yes. The app now computes reusable insight summaries and conservative candidate signals from persisted local transaction data.

Code behavior changed:
Yes. `transaction-store` now maintains an `insightsSnapshot`, new insight aggregators/detectors exist, and the insights screen consumes snapshot-backed outputs for part of the experience.

Files changed:

- `src/features/insights-engine/types.ts`
- `src/features/insights-engine/aggregates.ts`
- `src/features/insights-engine/formulas.ts`
- `src/features/insights-engine/__tests__/run-tests.ts`
- `src/stores/transaction-store.ts`
- `app/(tabs)/insights.tsx`
- `package.json`

Notes:
- No schema migration was required.
- Subscription and unusual-spend outputs remain intentionally conservative and are treated as candidates, not confirmed facts.
- Some screen-local heuristics still remain in `app/(tabs)/insights.tsx`; the core data foundation is now in place.

Next priority:
Migrate more of the remaining insights-tab derived UI logic onto the snapshot layer.

## Phase 2B - Insights Screen Snapshot Sections

Decision: KEEP

Reason:
More of the insights tab now reads snapshot-backed section outputs instead of recomputing those sections locally at render time.

Source of truth:
src/features/insights-engine/aggregates.ts

Commands verified:

- npm run test:insights: PASS

Behavior changed:
Yes. The insights screen now consumes snapshot-backed section data for spending patterns, habits, risks, observations, and coach tips.

Code behavior changed:
Yes. The aggregate layer now emits section-ready structures and the screen binds to them.

Notes:
- Some dormant legacy heuristic scaffolding remained on the screen after the first snapshot migration.
- This phase reduced screen-local heuristics but did not yet address the audited local-day bug or categorizer/parser readiness gaps.

Next phase:
Phase 2C - Audited Insights, Parser, and Categorizer Hardening

## Phase 2C - Audited Insights, Parser, and Categorizer Hardening

Decision: KEEP

Reason:
The highest-value audited readiness gaps are now remediated with direct code and validation evidence.

Source of truth:
src/features/sms-parser/engine.ts

Commands verified:

- npm test: PASS
- npm run test:insights: PASS
- .\node_modules\.bin\tsx.cmd src\features\categorizer\__tests__\run-tests.ts: PASS
- .\node_modules\.bin\tsx.cmd src\features\sms-parser\__tests__\test-production-safety.ts: PASS

Behavior changed:
Yes. Parser dedupe behavior is stricter for same-account transactions, categorizer matching is less collision-prone, and insights local-day bucketing is corrected in the targeted paths.

Code behavior changed:
Yes. Parser duplicate comparison, categorizer matching, categorizer defaults, and insights aggregate date-key handling were updated.

Files changed:

- `src/features/sms-parser/engine.ts`
- `src/features/sms-parser/__tests__/test-production-safety.ts`
- `src/features/categorizer/categorizer.ts`
- `src/features/categorizer/categories.ts`
- `src/features/categorizer/__tests__/run-tests.ts`
- `src/features/insights-engine/aggregates.ts`
- `src/features/insights-engine/__tests__/run-tests.ts`

Notes:
- The categorizer test path initially failed because `categories.ts` imported the broader theme barrel, which pulled `react-native` into a Node-only test run; this was fixed by importing `../../theme/colors` directly.
- Presentation copy was later moved out of `aggregates.ts` into a presenter layer in a follow-up pass.

Next priority:
Add broader contract-style coverage if a production-ready insights engine boundary is required.

## Phase 2C Follow-up - Remaining Categorizer and Insights Audit Closures

Decision: KEEP

Reason:
Closed the remaining audited broad-keyword categorizer collision path and the targeted insights snapshot edge-coverage gaps with direct regression evidence.

Source of truth:
src/features/categorizer/categorizer.ts

Commands verified:

- `.\node_modules\.bin\tsx.cmd src\features\categorizer\__tests__\run-tests.ts`: PASS
- `npm run test:insights`: PASS

Behavior changed:
Yes. The categorizer no longer auto-classifies solely from one low-signal generic keyword, and the insights evidence base now covers the previously open threshold, sparse-history, cadence, and mixed-category edge cases.

Code behavior changed:
Yes. Categorizer result fallback behavior changed for low-signal one-keyword matches, and insights test coverage expanded without requiring additional aggregate logic changes.

Files changed:

- `src/features/categorizer/categorizer.ts`
- `src/features/categorizer/__tests__/run-tests.ts`
- `src/features/insights-engine/__tests__/run-tests.ts`

Notes:
- The corroborated entertainment regression initially used the word `subscription`, which collided with the bills category; the fixture was narrowed to keep the test focused on the intended low-signal keyword guard.
- The audit status now treats broad keyword collisions and targeted insights snapshot edge coverage as closed, while the insights presentation-boundary cleanup remains open.

Next priority:
Expand contract-style `sections.*` coverage if the team wants a production-ready insights engine boundary.

## Phase 2C Follow-up - Insights Presentation Boundary Split

Decision: KEEP

Reason:
Closed the remaining insights contract-boundary issue by moving screen copy out of the aggregate layer and validating raw signals separately from presenter-mapped prose.

Source of truth:
src/features/insights-engine/presenter.ts

Commands verified:

- `npm run test:insights`: PASS

Behavior changed:
No user-visible copy direction was intentionally changed. The structural behavior changed: the insights engine now emits UI-agnostic section signals, and the screen receives copy from a presenter layer.

Code behavior changed:
Yes. `aggregates.ts` no longer owns screen prose for the audited section paths, `presenter.ts` now maps signals to copy, and the insights screen consumes the presenter output.

Files changed:

- `src/features/insights-engine/types.ts`
- `src/features/insights-engine/aggregates.ts`
- `src/features/insights-engine/presenter.ts`
- `src/features/insights-engine/__tests__/run-tests.ts`
- `app/(tabs)/insights.tsx`

Notes:
- The insights suite now validates both the raw snapshot signal contract and the presenter-mapped screen copy path.
- Repo-wide lint still fails on unrelated pre-existing unused-variable issues outside this change set.

Next priority:
Add broader contract-style coverage around the presenter boundary and remaining `sections.*` outputs if the team wants stronger production-readiness evidence.
