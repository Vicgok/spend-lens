# Invocation

## Purpose

This file defines how Codex or another AI coding agent should invoke the `.ai-team` workflow from a user prompt.

## Supported Invocations

### `ai-team:implement <task>`

Use this mode for end-to-end delivery work.

The Orchestrator must:

1. Parse everything after `ai-team:implement` as the task request.
2. Update `orchestrator/current-task.md` with the task, requirements, and acceptance criteria.
3. Initialize or refresh `orchestrator/execution-status.md`.
4. Set `execution-status.md` to the active role before each handoff.
5. Run the Planner stage and write `sub-agents/planner/implementation-plan.md`.
6. Review the plan, then run the Coder stage and write `sub-agents/coder/implementation.md`.
7. Run the Tester stage and write `sub-agents/tester/testing.md`.
8. Run the Auditor stage and write `sub-agents/auditor/audit.md`.
9. Run the Reviewer stage and write `sub-agents/reviewer/review.md`.
10. Set `execution-status.md` to `Complete` when the workflow finishes.
11. Update `orchestrator/progress.md` and `orchestrator/handoff.md`.
12. Respond to the user only after Review is complete.

Required behavior:

- Treat each stage as a handoff to a sub-agent role, even if one model is simulating the handoffs sequentially.
- Keep `orchestrator/execution-status.md` accurate so the active role is externally visible during execution.
- Emit a terminal-visible progress update before each stage using the format `[ai-team][<Agent>] <short status>`.
- Keep each role within its documented boundaries.
- Do not skip stages.
- Do not fabricate code execution, test results, or audit evidence.
- Re-enter the rejection loop if Review rejects the work.

### `ai-team:audit <task>`

Use this mode for audit-first work where the primary goal is to inspect an implementation, test coverage, evidence quality, or delivery readiness.

The Orchestrator must:

1. Parse everything after `ai-team:audit` as the audit task request.
2. Update `orchestrator/current-task.md` with audit-specific scope and acceptance criteria.
3. Initialize or refresh `orchestrator/execution-status.md`.
4. Set `execution-status.md` to the active role before each handoff.
5. Run the Planner stage to define the audit plan in `sub-agents/planner/implementation-plan.md`.
6. Run the Auditor stage and write `sub-agents/auditor/audit.md`.
7. If the audit requires code or test remediation, route work through Coder -> Tester -> Auditor again.
8. Run the Reviewer stage and write `sub-agents/reviewer/review.md`.
9. Set `execution-status.md` to `Complete` when the workflow finishes.
10. Update `orchestrator/progress.md` and `orchestrator/handoff.md`.
11. Respond to the user only after Review is complete.

Required behavior:

- Default to inspection and traceability, not feature implementation, unless remediation is necessary.
- Keep `orchestrator/execution-status.md` accurate so the active role is externally visible during execution.
- Emit a terminal-visible progress update before each stage using the format `[ai-team][<Agent>] <short status>`.
- Keep findings concrete and evidence-backed.
- Escalate unresolved gaps through the Reviewer decision.

## Role Loading Order

For any invocation, the acting agent should load these files first:

- `orchestrator/orchestrator.md`
- `orchestrator/workflow.md`
- `orchestrator/context.md`
- `orchestrator/current-task.md`

Then load only the role files needed for the current stage.

## Cross-Agent Contract

- Planner writes only planning artifacts.
- Coder writes only implementation artifacts and code changes.
- Tester writes only testing artifacts with real checks.
- Auditor writes only audit artifacts with real evidence.
- Reviewer writes only review artifacts and approval or rejection.
- Orchestrator remains the only user-facing agent.

## Terminal Visibility

During an `ai-team:*` run, the acting agent must emit short commentary updates that expose the active role in the terminal.

Use this format:

- `[ai-team][Orchestrator] recording task and preparing planner handoff`
- `[ai-team][Planner] drafting implementation plan`
- `[ai-team][Coder] applying approved changes`
- `[ai-team][Tester] validating implementation`
- `[ai-team][Auditor] checking traceability and evidence`
- `[ai-team][Reviewer] evaluating final quality`

Keep these updates brief and emit them at each role transition.

## Safe Parallel Execution

When a task spans multiple independent subsystems, the Orchestrator may fan out read-only analysis work in parallel after the Planner finishes.

Use this safe order:

1. Orchestrator records the task and constraints.
2. Planner defines scope, boundaries, and deliverables.
3. Parallel sub-agents inspect independent areas in read-only mode only.
4. Orchestrator merges findings into one prioritized result.
5. If fixes are needed, return to sequential execution for Coder -> Tester -> Auditor -> Reviewer.

Rules:

- Parallel sub-agents must not edit the same files.
- Parallel sub-agents must not publish final decisions directly to the user.
- Any write phase returns to sequential ownership before code changes or final review.
