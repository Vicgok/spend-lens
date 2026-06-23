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

## Phase 1C — Runtime Observability / Backfill Audit

Decision: KEEP / NO-OP

Reason:
No Phase 1C implementation is needed now.

Findings:
- processed_sms_messages ledger exists.
- Comparator-v2 is runtime transaction dedupe path.
- Duplicate skip logs already exist for live and historical flows.
- Backfill is not required for current runtime correctness.
- No files changed.

## Phase 2A — Insights Data Contract + Baseline Aggregation

Decision: KEEP

Reason:
Insights foundation was implemented using local-only pure functions and tests passed.

Files changed:
- src/features/insights-engine/types.ts
- src/features/insights-engine/normalization.ts
- src/features/insights-engine/aggregation.ts
- src/features/insights-engine/__tests__/aggregation.test.ts
- package.json

Tests:
- npm test src/features/insights-engine/__tests__/aggregation.test.ts
- npm test
- npm run test:research all

Next phase:
Phase 2B — Subscription Candidate Detector

## Phase 2B — Subscription Candidate Detector

Decision: KEEP

Reason:
Local subscription candidate detection was implemented and tests passed.

Files changed:
- src/features/insights-engine/types.ts
- src/features/insights-engine/detector.ts
- src/features/insights-engine/__tests__/detector.test.ts
- package.json

Tests:
- npm test src/features/insights-engine/__tests__/detector.test.ts
- npm test
- npm run test:research all

Next phase:
Phase 2C — Unusual Spend Detector


