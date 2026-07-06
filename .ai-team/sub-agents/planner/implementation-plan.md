# Implementation Plan

## Task

Implement Phase 1: remaining insights contract hardening through the `ai-team:implement` workflow, then update the audit and orchestration status artifacts.

## Requirements Summary

Close the remaining insights presentation-boundary gap with concrete presenter-boundary changes and focused contract coverage, while keeping the work scoped to `insights-engine` and maintaining the full Plan -> Code -> Test -> Audit -> Review trail.

## Impacted Files

- `src/features/insights-engine/presenter.ts`
- `src/features/insights-engine/__tests__/run-tests.ts`
- `app/(tabs)/insights.tsx`
- `.autoresearch/audits/2026-07-04-codebase-readiness-audit.md`
- `.ai-team/orchestrator/*.md`
- `.ai-team/sub-agents/*/*.md`

## Plan

1. Use Planner-owned read-only analysis to inspect the audit's remaining presenter-boundary gap and current insights screen dependencies in parallel.
2. In the Coder stage, move the remaining screen summary and fallback contract behavior behind the presenter boundary and remove direct screen reliance on raw snapshot candidate fields for that surface.
3. Expand `insights-engine` tests around presenter contract outputs, especially `sections.*` display mapping and empty/default fallback behavior.
4. In Tester, run the targeted insights suite and a typecheck to validate the contract changes.
5. In Auditor and Reviewer, verify that the evidence justifies closing Phase 1 without overstating broader subsystem readiness.

## Acceptance Criteria

- `insights-engine` exports UI-agnostic primitives for the remaining insights screen boundary.
- Presentation copy and default fallback changes no longer require aggregate-layer edits.
- Focused presenter-boundary tests cover the contract used by the screen.
- Audit and orchestration artifacts are updated with evidence-backed status changes.
- Real test execution is recorded for the changed areas.

## Risks

- Medium risk: moving too much behavior into the presenter could blur the aggregate/presenter split; the change should stay at the display-contract boundary only.
- Low risk: screen fallback paths may drift from mapped snapshot output if defaults are duplicated; tests should enforce parity.
