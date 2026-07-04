# Current Task

Phase: Phase 2C - Audited Insights, Parser, and Categorizer Hardening

Status: Completed

Mode: Implemented

Source of truth:
src/features/sms-parser/engine.ts

Previous phase:
Phase 2B - Insights Screen Snapshot Sections

Previous decision:
KEEP

Context:

- Phase 0 completed normalized machine-readable reports.
- Phase 1A completed comparator-v2 minimal runtime integration.
- Phase 1B completed raw SMS idempotency hardening.
- Phase 1C confirmed no further runtime observability/backfill work is required now.
- Phase 2 implemented a reusable insights snapshot layer on top of persisted local transactions.
- Phase 2B moved more insights-tab sections onto snapshot-backed outputs.
- A readiness audit identified one parser blocker, a weak categorizer matching surface, and an insights local-day bug plus coverage gaps.

Goal:
Close the highest-value audited readiness gaps without reopening the parser/dedupe architecture.

Primary target:
phase-2c-audited-insights-parser-categorizer-hardening

Outcome:

- Fixed the parser same-account dedupe false-positive by requiring aligned amount, transaction type, and normalized merchant semantics.
- Added parser production-safety regressions for same-account and different-merchant and same-account and different-amount pairs.
- Hardened categorizer matching with normalized token and phrase-aware scoring.
- Removed broad default keywords that were causing avoidable categorization collisions.
- Added a dedicated categorizer regression suite.
- Added low-signal keyword guards so one generic keyword like `movie` or `bill` no longer auto-classifies by itself.
- Replaced insights UTC day-key truncation with local-day key generation in the aggregate layer.
- Added insights coverage for empty snapshot sections and local-day observation behavior.
- Added insights coverage for unusual-spend threshold boundaries, sparse-history suppression, subscription cadence false positives, and mixed-category sparse snapshots.
- Split insights presentation copy out of `aggregates.ts` into a dedicated presenter layer and updated the screen to consume presenter-mapped copy.

Rules kept:

- No backend/API dependencies.
- No risky schema migration.
- No dedupe architecture rewrite.
- Safe parallel delegation limited to read-only subsystem analysis before sequential writes.

Success gates:

- parser dedupe blocker removed
- categorizer has dedicated regression coverage
- insights local-day behavior is deterministic in the targeted paths
- remaining broad-keyword categorizer collision path is reduced
- remaining targeted insights snapshot edge gaps are covered
- presentation copy no longer lives in the aggregate layer for the audited insights section paths
- all targeted validation commands pass with real evidence

Verification:

- npm test: PASS
- npm run test:insights: PASS
- .\node_modules\.bin\tsx.cmd src\features\categorizer\__tests__\run-tests.ts: PASS
- .\node_modules\.bin\tsx.cmd src\features\sms-parser\__tests__\test-production-safety.ts: PASS

Next priority:
Add broader contract-style coverage around `src/features/insights-engine/presenter.ts` and `sections.*` outputs if the insights engine itself needs a stronger production-ready boundary.
