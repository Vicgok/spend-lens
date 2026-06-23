Task: Phase 1B — Runtime Dedupe Hardening.

Mode: PLAN ONLY.

Do not edit files yet.

Goal:
Audit persistence/runtime dedupe risks after Phase 1A and prepare the smallest safe implementation plan.

Source of truth:
research-loop/test-suite/reports/latest-metrics.json

Context:

- Phase 0 normalized test outputs.
- Phase 1A comparator-v2 minimal runtime integration is complete.
- Parser is frozen.
- Dedupe engine is frozen.
- Production dedupe path is dedupeTransactions.
- generateSMSHash is backward-compatible/raw-message-idempotency only.

Inspect:

- src/features/sms-parser/sms-reader.ts
- src/lib/database.ts
- transaction store insert flow
- SQLite schema/migrations
- checkSMSHashExists or equivalent
- dedupeGroupId usage
- sms_hash unique/index behavior

Questions to answer:

1. Is raw SMS message idempotency persisted separately from transaction rows?
2. Does app restart/rescan still risk duplicate transaction insert?
3. Is transactions.sms_hash still acting as transaction-level uniqueness?
4. Is dedupeGroupId persisted consistently?
5. Does live duplicate skip mark the raw SMS as processed?
6. Do skipped duplicate members in historical scan get marked as processed?
7. Is a DB migration needed now?
8. What is the smallest safe Phase 1B implementation?

Rules:

- No parser changes.
- No dedupe engine changes.
- No evaluator changes.
- No corpus changes.
- DB/schema changes are allowed only if migration-safe.
- Do not remove sms_hash column.
- Do not destroy existing data.

Return:

1. Current persistence dedupe path
2. Risks found
3. Required files to change
4. DB migration needed yes/no
5. Migration-safe plan
6. Implementation steps
7. Test commands
8. Manual verification checklist
9. Exact next implementation prompt

Acceptance for future implementation:

- same raw SMS cannot create duplicate transaction after restart/rescan
- different SMS for same transaction are blocked by comparator-v2
- raw SMS hash is message-level idempotency only
- dedupeGroupId is transaction-level grouping
- existing transactions remain valid
- all tests pass
