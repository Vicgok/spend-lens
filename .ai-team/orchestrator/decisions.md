# Decisions

## Decision Log

| Date | Decision | Rationale | Status |
| --- | --- | --- | --- |
| 2026-07-04 | Store all coordination state as Markdown under `.ai-team/`. | The requested system must use Markdown only and avoid automation files. | Accepted |
| 2026-07-04 | Limit shared memory to `orchestrator/*.md`. | Keeps cross-agent coordination explicit and avoids hidden state. | Accepted |
| 2026-07-04 | Require Plan -> Code -> Test -> Audit -> Review for every task. | Adds explicit evidence, traceability, and risk validation between testing and final review. | Accepted |
| 2026-07-07 | Treat the presenter as the insights screen contract boundary. | Keeps `insights-engine` aggregate outputs UI-agnostic while allowing screen copy and fallback behavior to evolve without aggregate-layer edits. | Accepted |
| 2026-07-07 | Canonicalize learned categorizer keywords before persistence. | User corrections should improve future categorization without storing transient payment boilerplate or reference noise as durable category keywords. | Accepted |
| 2026-07-07 | Tie freeze claims to an executed release audit checklist. | Cross-system readiness should be based on one passing command set and golden fixture evidence, not descriptive status language alone. | Accepted |
