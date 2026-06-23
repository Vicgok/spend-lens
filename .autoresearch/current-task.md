# Current Task

Phase: Phase 1B - Runtime Dedupe Hardening

Status: Completed

Mode: Implemented

Source of truth:
research-loop/test-suite/reports/latest-metrics.json

Previous phase:
Phase 1A - SMS Reader Comparator-V2 Minimal Runtime Integration

Previous decision:
KEEP

Context:

- Phase 0 completed normalized machine-readable reports.
- Phase 1A completed comparator-v2 minimal runtime integration.
- Phase 1B adds persistence-level raw SMS idempotency hardening.
- Parser remains frozen.
- Dedupe engine remains frozen.
- Production dedupe path is dedupeTransactions.
- generateSMSHash is backward-compatible/raw-message-idempotency only.

Goal:
Harden runtime dedupe persistence and restart/rescan safety.

Primary target:
phase-1b-runtime-dedupe-hardening

Outcome:

- Added migration-safe `processed_sms_messages` persistence for raw SMS idempotency.
- Same raw SMS is now recorded separately from transaction rows.
- Comparator-v2 still decides transaction-level duplicates.
- `transactions.sms_hash` is now written as message-level idempotency for new SMS inserts.
- dedupeGroupId remains the transaction-level grouping value.
- Historical batch duplicates and persisted duplicate skips are marked as processed.
- Live duplicate skips are marked as processed.
- Existing transaction data was preserved.

Rules kept:

- No parser logic changes.
- No dedupe engine changes.
- No corpus changes.
- No evaluator metric formula changes.
- No destructive schema change.
- `sms_hash` column retained.
- Existing data preserved.

Success gates:

- parser accuracy >= 97
- dedupe precision = 100
- dedupe recall = 100
- falseMerge = 0
- npm test passes
- npm run test:research all passes
- no duplicate transaction after app restart/rescan for newly processed raw SMS

Verification:

- npm test: PASS
- npm run test:research all: PASS

Next priority:
Phase 1C - optional backfill / runtime observability hardening if needed.
