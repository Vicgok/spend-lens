Task: Phase 1C — Optional Backfill / Runtime Observability Hardening.

Mode: PLAN ONLY.

Do not edit files yet.

Goal:
Audit whether Phase 1C is actually needed.

Check:

1. Are old rows missing dedupeGroupId?
2. Is backfill required for current app behavior?
3. Are duplicate skips logged clearly?
4. Can we inspect historical scan counts?
5. Can we inspect live SMS duplicate decisions?
6. Is processed SMS/message ledger observable?
7. Any low-risk runtime counters needed?

Rules:

- No parser changes.
- No dedupe engine changes.
- No evaluator changes.
- No corpus changes.
- No DB migration unless clearly needed.
- Prefer observability over logic changes.

Return:

- Phase 1C needed: yes/no
- exact reason
- files to change
- smallest safe implementation
- tests to run
- KEEP/REVERT criteria
