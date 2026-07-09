# Implementation Plan

## Task

Implement Phase 3 only from the 2026-07-09 MVP readiness audit: decompose the History and Insights tab screens by extracting screen-local derived logic and simulation/controller behavior into reusable seams without changing the intended UI behavior.

## Requirements Summary

Phase 3 should reduce the monolithic risk in `transactions.tsx` and `insights.tsx` without broadening into visual redesign or production-hardening work. The highest-value slice is to move screen-local derivation, grouping, chart prep, and dev-simulation/controller logic behind dedicated feature seams while preserving the current UI contract.

## Impacted Files

- `app/(tabs)/transactions.tsx`
- `app/(tabs)/insights.tsx`
- `src/features/history/*`
- `src/features/insights-screen/*`
- `.ai-team/orchestrator/*.md`
- `.ai-team/sub-agents/*.md`

## Plan

1. Create a History feature seam that owns timeline chart derivation, section grouping, month options, and observation text.
2. Refactor `app/(tabs)/transactions.tsx` to consume the extracted History helpers while keeping the presentational structure stable.
3. Create an Insights feature seam that owns temporary scan-data generation, scan orchestration helpers, and primary derived analytics helpers.
4. Refactor `app/(tabs)/insights.tsx` to consume the extracted Insights helpers while keeping the presentational structure stable.
5. Run `npm run check` and record the result in `.ai-team`.

## Acceptance Criteria

- The History screen delegates its core derivation seams to a dedicated feature module.
- The Insights screen delegates its simulation/controller and major derivation seams to dedicated feature modules.
- No concurrent implementation lane edits the same file.
- The screen compiles cleanly after the Phase 3 changes.

## Risks

- Both screens are large and carry UI-specific inline icons/styles, so this phase should stop at logic decomposition instead of forcing a full presentational component breakup.
- The Insights screen still contains dev simulation behavior by design; this phase should isolate it structurally, not remove it.
