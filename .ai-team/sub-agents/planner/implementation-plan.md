# Implementation Plan

## Task

Implement the remaining audited fixes for `categorizer` broad keyword collisions and `insights-engine` snapshot edge coverage through the `ai-team:implement` workflow, then update audit and `.autoresearch` memory.

## Requirements Summary

Close the remaining categorizer and insights audit gaps with concrete code and regression coverage, while keeping the work scoped to the targeted subsystems and maintaining the full Plan -> Code -> Test -> Audit -> Review trail.

## Impacted Files

- `src/features/categorizer/categorizer.ts`
- `src/features/categorizer/__tests__/run-tests.ts`
- `src/features/insights-engine/aggregates.ts` if targeted edge tests expose a code defect
- `src/features/insights-engine/__tests__/run-tests.ts`
- `.autoresearch/audits/2026-07-04-codebase-readiness-audit.md`
- `.autoresearch/current-task.md`
- `.autoresearch/decision-log.md`
- `.ai-team/orchestrator/*.md`
- `.ai-team/sub-agents/*/*.md`

## Plan

1. Use Planner-owned read-only analysis to inspect the remaining categorizer weak-keyword surface and the audit's listed insights coverage gaps in parallel.
2. In the Coder stage, reduce remaining categorizer broad-keyword collisions by rejecting or down-weighting low-signal single-keyword matches unless corroborated by stronger evidence, then add regressions for those ambiguity paths.
3. Extend `insights-engine` tests around the specific open audit gaps: subscription false-positive edges, unusual-spend threshold boundaries, and sparse-history behavior; only patch aggregate code if the new tests reveal a real defect.
4. In Tester, run the categorizer and insights suites that directly validate the targeted changes.
5. In Auditor and Reviewer, verify that the new evidence justifies updated audit statuses and that `.autoresearch` memory reflects the new implementation state without overstating remaining risk.

## Acceptance Criteria

- Remaining low-signal broad keyword categorizer collisions are reduced with explicit regression coverage.
- `insights-engine` has real passing tests for the targeted snapshot edge cases called out by the audit.
- Audit and `.autoresearch` memory are updated with evidence-backed status changes.
- Real test execution is recorded for the changed areas.

## Risks

- Medium risk: if the categorizer hardening is too aggressive, legitimate one-keyword transactions could become uncategorized; the fix should target only low-signal keywords.
- Low-to-medium risk: the new insights tests may expose deeper heuristic issues, in which case the code change should stay minimal and evidence-driven.
