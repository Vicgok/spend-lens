Use docs/architecture.md and docs/codebase-index.md as optional hints only.

Actual code is the source of truth.

Task:
Phase 2F - Insights UI Regression Audit

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
- audit how the integrated insights screen consumes generateAllInsights(...)
- identify UI regression risks in current summary, checklist, and empty-state flows
- plan targeted follow-up fixes only if they are presentation regressions

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
Plan a focused regression audit to ensure the existing insights screen still behaves correctly after the Phase 2E composer integration.

Plan only:
1. Current screen behaviors that must be regression-checked.
2. Which flows now depend on unusual_spend and structured subscription cards.
3. Empty-state and fallback copy risks.
4. Risk-checklist and summary-card consistency risks.
5. Required follow-up scope, if any.
6. Exact next implementation prompt.

Success gates for future implementation:
- no broken existing insight flows
- no missing summary-card data for composer-driven insights
- empty-state still behaves correctly
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
