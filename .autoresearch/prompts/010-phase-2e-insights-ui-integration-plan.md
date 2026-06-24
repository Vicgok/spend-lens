Use docs/architecture.md and docs/codebase-index.md as optional hints only.

Actual code is the source of truth.

Task:
Phase 2E — Insights UI Integration

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
- plan how to connect the existing insights screen to generateAllInsights(...)
- plan how to render existing InsightCardData
- plan how to preserve current UX and visual design

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
- app/(tabs)/insights.tsx only, unless plan proves another directly imported UI component is required

Forbidden Files:
- parser files
- dedupe files
- DB files
- SMS runtime files
- corpus/evaluator files

Goal:
Plan the safest UI integration path so the existing insights screen presents composer output from generateAllInsights(...), including unusual_spend and structured subscription cards, without changing design.

Plan only:
1. Current insights UI data flow.
2. Whether insights.tsx already uses InsightCardData[].
3. Required changes to consume generateAllInsights(...).
4. How unusual_spend cards should map to existing UI patterns.
5. How structured subscription cards should map to existing UI patterns.
6. Empty-state handling.
7. Risks.
8. Exact next implementation prompt.

Success gates for future implementation:
- existing insights screen consumes composer output correctly
- unusual_spend cards render in current insight-summary flow
- structured subscription cards render in current insight-summary flow
- empty-state behavior still works
- existing non-overlapping insights still render
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