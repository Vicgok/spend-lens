# Current Task

Phase: Phase 1A — SMS Reader Comparator-V2 Minimal Runtime Integration

Status: Ready

Mode: Plan-only

Source of truth:
research-loop/test-suite/reports/latest-metrics.json

Goal:
Audit and minimally integrate comparator-v2 into the real app SMS runtime flow.

Primary target:
sms-reader minimal runtime integration.

Context:

- Phase 0 is complete.
- Test-suite now emits normalized latest-metrics.json for parser, dedupe, and all.
- Orchestrator should consume JSON reports, not console logs.
- Parser is frozen.
- Dedupe engine is frozen.
- Production dedupe path is dedupeTransactions.
- generateSMSHash is backward-compatible/raw-message-idempotency only.

Rules:

- Do not change parser logic.
- Do not change dedupe engine logic.
- Do not change corpus.
- Do not change evaluator metric formulas.
- Do not do DB migration in Phase 1A.
- Do not remove sms_hash unique index in Phase 1A.
- Do not create processed_sms_messages table in Phase 1A.

Success gates:

- parser accuracy >= 97
- dedupe precision = 100
- dedupe recall = 100
- falseMerge = 0
- npm test passes
- npm run test:research all passes

Next priority:
sms-reader-minimal-runtime-integration
