Task: Phase 2D - Insights Engine Composer

Mode: PLAN ONLY.

Do not edit files yet.

Goal:
Plan how to expose one app-facing local composer API inside insights-engine by combining existing heuristic cards with structured subscription and unusual-spend detector output.

Context:
- Parser is frozen.
- Dedupe engine is frozen.
- Phase 2A, 2B, and 2C are complete.
- Structured detector outputs now exist for subscription candidates and unusual spend candidates.
- The app still expects `InsightCardData[]`.

Focus:
Plan a safe adapter/composer path so `generateAllInsights(...)` becomes the single app-facing local insights API without changing DB schema or parser behavior.

Plan only:
1. Which structured detector outputs should be composed first.
2. How to map detector outputs into `InsightCardData`.
3. Whether to keep or retire overlapping heuristic detectors.
4. Required file updates and sequencing.
5. Test strategy for composer behavior and regression safety.
6. Exact next implementation prompt.

Rules:
- No AI API.
- Local-only.
- No DB schema changes unless clearly justified.
- Do not modify parser or dedupe behavior.
