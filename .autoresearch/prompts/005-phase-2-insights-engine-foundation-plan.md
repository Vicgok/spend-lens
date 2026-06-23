Task: Phase 2 — Insights Engine Foundation.

Mode: PLAN ONLY.

Do not edit files yet.

Goal:
Plan the first production-safe insights engine layer on top of clean parsed + deduped transactions.

Context:
- Parser frozen.
- Dedupe engine frozen.
- SMS runtime integration complete.
- Runtime hardening complete.
- processed_sms_messages ledger exists.
- Comparator-v2 is transaction-level dedupe path.

Focus:
Build non-AI, local-first insights foundation.

Inspect:
- transaction schema
- transaction store
- dashboard/insights screens
- category data
- account balance flow
- existing analytics helpers if any

Plan only:
1. Current data model readiness
2. What insights can be safely computed now
3. What fields are missing
4. Required modules/files
5. MVP insight types
6. Algorithmic approach
7. Test strategy
8. Exact next implementation prompt

Recommended MVP insights:
- daily spend total
- weekly/monthly spend trend
- category spend breakdown
- unusual spend detection
- subscription candidate detection
- duplicate-safe transaction count
- account-wise spend summary

Rules:
- No AI API.
- Local-only.
- No backend.
- No parser changes.
- No dedupe engine changes.
- No risky DB migration unless clearly needed.