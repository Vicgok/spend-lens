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
