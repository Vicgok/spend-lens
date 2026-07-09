# Implementation Plan

## Task

Audit app responsiveness across different resolutions, screen sizes, notched devices, and punch-hole devices.

## Requirements Summary

Inspect the existing Expo/React Native app implementation for responsive layout behavior and safe-area/cutout handling. Produce an evidence-backed audit, not a code change, unless the audit exposes a concrete fix that is required before answering.

## Impacted Files

- `.ai-team/orchestrator/current-task.md`
- `.ai-team/orchestrator/execution-status.md`
- `.ai-team/sub-agents/planner/implementation-plan.md`
- `.ai-team/sub-agents/auditor/audit.md`
- `.ai-team/sub-agents/reviewer/review.md`
- App source files under the route, component, and style directories will be inspected read-only.

## Plan

1. Inspect project structure, package dependencies, app root layout, and safe-area providers.
2. Inspect major route screens and shared components for fixed sizing, scroll behavior, viewport assumptions, and cutout-safe positioning.
3. Review validation options available locally; run non-invasive checks if they are already project-supported and do not interfere with the ongoing build.
4. Write an audit with evidence, findings, and recommendations.
5. Run reviewer pass over audit completeness and update orchestrator status/progress/handoff.

## Acceptance Criteria

- Safe-area and cutout handling is assessed with file-level evidence.
- Responsive layout behavior is assessed across small phones, large phones, tablets, and web where relevant.
- Findings distinguish verified implementation facts from risks or untested gaps.
- Reviewer approves the audit before the final response.

## Risks

- Without device screenshots or simulator testing, visual behavior can only be inferred from code.
- The app may currently be building, so the audit should avoid starting competing long-running build/dev-server processes.
- Some responsive risks may depend on runtime data volume, text scaling, or platform-specific header behavior.
