Task: Phase 1A — sms-reader comparator-v2 minimal integration.

Mode: PLAN ONLY.

Goal:
Audit current sms-reader runtime dedupe flow and prepare smallest safe implementation plan.

Do not edit code.

Check:

- historical SMS scan
- live SMS receive flow
- generateSMSHash usage
- dedupeTransactions usage
- DB insert/checkSMSHashExists flow

Return:

- current runtime dedupe path
- gaps
- files to change
- DB migration needed now yes/no
- implementation plan
- test commands
- risks
- exact next implementation prompt

Rules:

- no parser changes
- no dedupe engine changes
- no evaluator changes
- no corpus changes
