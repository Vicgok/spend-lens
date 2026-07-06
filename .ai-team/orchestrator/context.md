# Context

## Repository Context

This repository is `automate-emis`. The AI Engineering Team coordination system lives under `.ai-team/` and does not change runtime application behavior.

## Coordination Model

- Orchestrator is user-facing.
- Planner, Coder, Tester, Auditor, and Reviewer are internal sub-agents.
- Shared memory is stored only in `orchestrator/*.md`.
- Sub-agents write only to their own role files.
- Templates in `templates/*.md` keep records consistent.

## Constraints

- Markdown only.
- No scripts.
- No JSON.
- No automation.
- No fabricated test results.
- No fabricated audit evidence.
