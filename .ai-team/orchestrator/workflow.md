# Workflow

## Standard Flow

1. User sends request to Orchestrator.
2. Orchestrator records or updates the task in `current-task.md`.
3. Orchestrator sets `execution-status.md` to `Planner`.
4. Planner analyzes requirements and writes `sub-agents/planner/implementation-plan.md`.
5. Orchestrator reviews the plan, sets `execution-status.md` to `Coder`, and delegates approved work.
6. Coder implements the approved plan and writes `sub-agents/coder/implementation.md`.
7. Orchestrator sets `execution-status.md` to `Tester`.
8. Tester validates the implementation and writes `sub-agents/tester/testing.md`.
9. Orchestrator sets `execution-status.md` to `Auditor`.
10. Auditor inspects evidence, risks, and traceability and writes `sub-agents/auditor/audit.md`.
11. Orchestrator sets `execution-status.md` to `Reviewer`.
12. Reviewer evaluates the implementation and writes `sub-agents/reviewer/review.md`.
13. If approved, Orchestrator sets `execution-status.md` to `Complete`, updates progress, handoff, and final response.
14. If rejected, Orchestrator sets `execution-status.md` to the next remediation stage and routes fixes through Coder -> Tester -> Auditor -> Reviewer again.

## Iteration Rules

- Keep each iteration scoped to a small, reviewable change.
- Do not expand scope without an Orchestrator decision.
- Do not implement before planning.
- Do not claim tests passed unless they were actually executed.
- Do not mark an audit check complete without evidence from implementation or testing records.
- Do not respond to the user until the Review stage is complete.

## Parallel Safe Order

Parallel execution is allowed only when outputs do not conflict and no stage depends on another stage's unfinished artifact.

Safe parallel patterns:

1. Planner runs alone first.
2. After planning, independent read-only auditors or researchers may inspect separate subsystems in parallel.
3. After coding, independent validation tasks may run in parallel if they write to separate scratch notes or temporary outputs.
4. Auditor and Reviewer remain sequential in the final decision path.

Unsafe parallel patterns:

- Planner and Coder at the same time.
- Two Coders editing the same files without explicit partitioning.
- Tester and Coder on the same artifact while implementation is still changing.
- Reviewer before Auditor evidence is complete.

Default safe order for multi-area audits:

- Orchestrator
- Planner
- Parallel read-only subsystem audits
- Orchestrator synthesis
- Reviewer

## Rejection Loop

When Reviewer rejects a change:

1. Orchestrator records review feedback in `current-task.md`.
2. Orchestrator sets `execution-status.md` to `Coder`.
3. Coder applies only the requested fixes.
4. Orchestrator sets `execution-status.md` to `Tester`.
5. Tester reruns relevant validation.
6. Orchestrator sets `execution-status.md` to `Auditor`.
7. Auditor reruns focused audit checks where evidence changed.
8. Orchestrator sets `execution-status.md` to `Reviewer`.
9. Reviewer rechecks the revised work.
10. Orchestrator records the final outcome.
