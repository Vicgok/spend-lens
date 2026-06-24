# Insights Roadmap

## Goal

Build a production-ready local insights system that turns transaction data into deterministic, trustworthy insight cards for the app UI without changing parser, dedupe, DB schema, or SMS runtime behavior.

## Bucket 1: Foundation

Purpose: establish the contract, pipeline shape, and app-facing integration seam.

Included phases:
- `005` Phase 2 planning baseline
- `006` Phase 2A - Insights data contract and baseline aggregation
- `009` Phase 2D - Insights engine composer

What this bucket delivers:
- normalized insight input model
- duplicate-safe transaction aggregation
- one app-facing composer API: `generateAllInsights(...)`
- deterministic mapping from engine output to `InsightCardData[]`

Exit criteria:
- insights can be generated from local transaction data through a single stable API
- composition logic is testable and deterministic
- no parser or dedupe regressions in validation

## Bucket 2: Intelligence

Purpose: add useful, local-first detectors that produce structured insights.

Included phases:
- `007` Phase 2B - Subscription candidate detector
- `008` Phase 2C - Unusual spend detector

What this bucket delivers:
- recurring merchant detection for subscription candidates
- prior-only merchant baseline detection for unusual spend
- structured detector outputs preferred over overlapping heuristics

Exit criteria:
- detectors emit structured, deterministic candidates
- overlapping heuristic cards are suppressed when structured candidates exist
- non-overlapping heuristics still remain available

## Bucket 3: Productization

Purpose: make the insight output usable, understandable, and stable in the app experience.

Included phases:
- `010` Phase 2E - Insights UI integration
- `011` Phase 2F - Insights UI regression audit follow-up
- `012` Phase 2G - Insights copy consistency audit

What this bucket delivers:
- existing Insights screen consumes composer output
- unusual spend and subscription cards render consistently
- fallback states, checklist behavior, and guidance copy stay coherent
- regression audit path for UI behavior after each integration step

Exit criteria:
- app renders structured insights without special-case drift
- empty and mixed states behave predictably
- copy and guidance are consistent across insight types

## Roadmap Summary

The sequence is:

1. Foundation: make the pipeline real.
2. Intelligence: make the pipeline useful.
3. Productization: make the output trustworthy in the product.

## Phase 2 Exit Criteria

Phase 2 should be considered complete only when all of the following are true:

- a single local composer API exists and remains the source of truth for app-facing insights
- subscription and unusual-spend insights are produced through structured detector outputs
- overlapping heuristic subscription cards are suppressed when structured candidates exist
- non-overlapping heuristics still appear when they add value
- the Insights UI renders supported card types consistently from composer output
- empty, mixed, and fallback states behave predictably
- copy and guidance are consistent across supported insight types
- `npm test` passes
- `npm run test:research all` passes
- parser accuracy does not regress below the accepted threshold
- dedupe precision and recall remain at `100`
- false merge remains `0`

## Phase 2 Completion Signal

When the exit criteria are satisfied:

- no new Phase 2 prompt should be created unless a real gap against these criteria is found
- follow-up work should move to a new roadmap area such as ranking, new detector expansion, or post-Phase-2 UX refinement
- prompt numbering should stop being treated as the definition of completion; the exit criteria are the definition of completion

## Suggested Next Planning Rule

For any new insights phase, classify it before work starts:

- Foundation: only if it changes contracts, aggregation, composition, or engine boundaries
- Intelligence: only if it adds or improves a detector
- Productization: only if it changes UI behavior, ranking, copy, presentation, or regression hardening

If a proposed phase spans more than one bucket, split it into separate phases before implementation.
