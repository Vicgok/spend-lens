Use docs/architecture.md and docs/codebase-index.md as optional hints only.

Actual code is the source of truth.

Task:
Phase 2G - Insights Copy Consistency Audit

Mode:
PLAN ONLY.

Do not edit files.
Do not update .autoresearch.

Precondition:
- Verify previous phase status from:
  - .autoresearch/state.json
  - .autoresearch/decision-log.md
- Previous phase must be KEEP or KEEP_NO_OP.
- If not KEEP, stop and report.

Read only:
- app/(tabs)/insights.tsx
- src/features/insights-engine/detector.ts

Rules:
- Do not scan the full repo.
- Do not edit files.
- If another file is required, stop and ask before continuing.
- First return a 5-line implementation plan.
- If docs conflict with code, trust code and report documentation drift.

Source of Truth Priority:
1. Actual codebase
2. research-loop/test-suite/reports/latest-metrics.json
3. .autoresearch/*
4. docs/*

In Scope:
- audit wording consistency across summary, checklist, guidance, and empty/fallback messaging
- identify copy mismatches caused by composer-driven card types
- plan targeted copy-only fixes if needed

Out Of Scope:
- implementation
- new features
- new detectors
- new screens
- UI redesign
- parser changes
- dedupe changes
- DB schema changes
- SMS runtime changes

Expected Future Implementation Targets:
- app/(tabs)/insights.tsx only, unless the audit proves another directly imported UI component is required

Forbidden Files:
- parser files
- dedupe files
- DB files
- SMS runtime files
- corpus/evaluator files

Goal:
Plan a focused copy audit so the integrated insights screen uses coherent user-facing language for composer-driven insights.

Plan only:
1. Which screen copy paths should be audited first.
2. Which composer-driven card types create the highest copy-drift risk.
3. Empty and fallback wording risks.
4. Checklist and guidance wording risks.
5. Required follow-up scope, if any.
6. Exact next implementation prompt.

Success gates for future implementation:
- no misleading copy for composer-driven insights
- no broken existing flows
- no visual redesign

Future test commands:
- npm test
- npm run test:research all

Return:
- 5-line implementation plan
- files to change
- files not to change
- risks
- exact next implementation prompt
