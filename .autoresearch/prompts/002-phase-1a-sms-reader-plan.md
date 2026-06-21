Task: Phase 1A — SMS Reader Comparator-V2 Minimal Runtime Integration.

Mode: PLAN ONLY.

Do not edit files yet.

Goal:
Audit current app SMS ingestion flow and prepare the smallest safe implementation plan for comparator-v2 runtime integration.

Source of truth:
research-loop/test-suite/reports/latest-metrics.json

Context:

- Phase 0 completed.
- Normalized latest-metrics.json files exist for parser, dedupe, and all.
- Parser is frozen.
- Dedupe engine is frozen.
- Production dedupe path is dedupeTransactions.
- generateSMSHash is backward-compatible/raw-message-idempotency only.

Inspect:

- src/features/sms-parser/sms-reader.ts
- src/lib/database.ts
- transaction store insert flow if needed
- live SMS receiver flow if needed

Check:

1. Historical SMS scan flow
2. Live SMS receive flow
3. generateSMSHash usage
4. dedupeTransactions usage
5. checkSMSHashExists usage
6. DB insert flow
7. Whether app runtime still relies on legacy hash-only transaction dedupe

Rules:

- No parser changes.
- No dedupe engine changes.
- No evaluator changes.
- No corpus changes.
- No DB migration in Phase 1A.
- Do not remove sms_hash unique index.
- Do not create processed_sms_messages table.

Return:

1. Current runtime dedupe path
2. Gaps
3. Files to change
4. Whether DB migration is needed now: yes/no
5. Minimal implementation plan
6. Test commands
7. Risks
8. Exact next implementation prompt

Acceptance for future implementation:

- Historical scan uses dedupeTransactions before insert.
- Live SMS uses comparator-v2-compatible duplicate check.
- generateSMSHash is not the transaction-level duplicate decision.
- Existing smsHash check remains temporary raw-message guard.
- No duplicate transaction after app restart/rescan.
- Different accounts do not false merge.
- BNPL/wallet + bank duplicate still merges.
