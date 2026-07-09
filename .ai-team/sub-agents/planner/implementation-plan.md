# Implementation Plan

## Task

Implement Phase 5 only from the 2026-07-09 MVP readiness audit: harden production-facing runtime behavior by replacing weak ID generation, removing runtime-only shortcuts, and confining dev-only simulation behavior.

## Requirements Summary

Phase 5 should address the clearest operational shortcuts still present in primary runtime paths without broadening into unrelated UX or architecture work. The highest-value slice is to strengthen database IDs, replace direct database `console.*` logging with the centralized logger, remove the Settings runtime `require()`, and keep the Insights simulation out of the normal production interaction path.

## Impacted Files

- `src/lib/database.ts`
- `src/lib/logger.ts`
- `app/(tabs)/settings.tsx`
- `app/(tabs)/insights.tsx`
- `.ai-team/orchestrator/*.md`
- `.ai-team/sub-agents/*.md`

## Plan

1. Replace the `Math.random()`-based database ID helper with the existing `uuid` dependency.
2. Route database migration/logging errors through the centralized logger instead of direct `console.*` calls.
3. Replace the Settings clear-data runtime `require()` path with a static import.
4. Confine the Insights simulation entry points to development mode so production users are not prompted to simulate transactions.
5. Run `npm run check` and `npm run test:production-gate`, then record the results in `.ai-team`.

## Acceptance Criteria

- Database IDs no longer depend on `Math.random()`.
- The Settings clear-data path no longer relies on a runtime `require()`.
- The production-gate fixture path still passes after the runtime hardening changes.
- The development-only Insights simulation is not exposed as a normal production affordance.

## Risks

- The repository still contains many app-level `console.*` calls outside this slice; this phase should focus on the database/runtime shortcut paths explicitly called out by the audit.
- The Insights simulation still exists for development; this slice should confine it rather than delete the supporting code outright.
