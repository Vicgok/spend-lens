# Current Task

Phase: Phase 2 - Insights Engine Foundation

Status: Completed

Mode: Implemented

Source of truth:
src/features/insights-engine/aggregates.ts

Previous phase:
Phase 1C - Runtime Observability / Backfill Audit

Previous decision:
KEEP / NO-OP

Context:

- Phase 0 completed normalized machine-readable reports.
- Phase 1A completed comparator-v2 minimal runtime integration.
- Phase 1B completed raw SMS idempotency hardening.
- Phase 1C confirmed no further runtime observability/backfill work is required now.
- Parser remains frozen.
- Dedupe engine remains frozen.
- Production dedupe path is comparator-v2-backed transaction persistence.
- `processed_sms_messages` ledger exists.
- The app already had transaction, category, account, analytics, and insights-screen building blocks.
- Phase 2 implemented a reusable insights snapshot layer on top of persisted local transactions.

Goal:
Establish a production-safe, local-first insights data foundation on top of the existing deduped transaction ledger.

Primary target:
phase-2-insights-engine-foundation

Outcome:

- Added reusable `InsightsSnapshot` types and deterministic aggregation helpers.
- Added daily/weekly/monthly totals and weekly/monthly trend deltas.
- Added category spend breakdown and account-wise spend summaries.
- Added conservative unusual-spend candidate detection.
- Added conservative subscription-candidate detection.
- Wired `transaction-store` to maintain `insightsSnapshot`.
- Updated the insights screen to consume snapshot-backed signals for survival score and summary cards.
- Added focused insights tests.

Rules kept:

- No parser logic changes.
- No dedupe engine changes.
- No backend/API dependencies.
- No risky schema migration.
- No research metric formula changes.

Success gates:

- insights computed from persisted local data
- reusable non-UI insights snapshot exists
- category/account/trend summaries are deterministic
- heuristic outputs are labeled conservatively
- focused tests exist for the new pure computations

Verification:

- npm run check: PASS
- npm test: PASS
- npm run test:insights: PASS

Next priority:
Replace more remaining screen-local insights heuristics in `app/(tabs)/insights.tsx` with snapshot-backed sections.
