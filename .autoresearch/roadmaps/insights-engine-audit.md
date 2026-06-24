# Insights Engine Audit

## Audit Goal

Audit the current insights engine so future work is split into focused phases instead of continuing a broad Phase 2 chain.

Source of truth used:
- actual code in `src/features/insights-engine/*`
- app consumer in `app/(tabs)/insights.tsx`
- `.autoresearch/state.json`
- `.autoresearch/decision-log.md`

Previous phase status check:
- `lastDecision` in `.autoresearch/state.json` is `KEEP`
- latest recorded insights phases in `.autoresearch/decision-log.md` are `KEEP`

## Executive Summary

The engine is far enough along that it should no longer be treated as one open-ended implementation stream.

The current state is:
- core engine boundary: mostly established
- detector layer: functional but still mixed with legacy heuristic responsibilities
- composer layer: working, but ordering and ownership rules are implicit instead of formalized
- UI integration: active and useful, but still somewhat coupled to card-type-specific assumptions in the screen

Recommendation:
- close Phase 2 after copy-consistency only if no hard gaps remain against the roadmap exit criteria
- stop creating mixed-purpose insights phases
- split follow-up work into focused tracks: `engine hardening`, `detector expansion`, and `presentation/ranking`

## Findings By Area

### 1. Engine Boundary

Status: `needs hardening`

What is working:
- one app-facing composer exists: `generateAllInsights(...)` in [detector.ts](/abs/path/D:/Documents/StartUp/spend-lense/src/features/insights-engine/detector.ts:342)
- the app screen consumes that composer directly in [insights.tsx](/abs/path/D:/Documents/StartUp/spend-lense/app/(tabs)/insights.tsx:514)
- normalization and duplicate filtering are already isolated in [normalization.ts](/abs/path/D:/Documents/StartUp/spend-lense/src/features/insights-engine/normalization.ts:1)
- baseline aggregation helpers exist in [aggregation.ts](/abs/path/D:/Documents/StartUp/spend-lense/src/features/insights-engine/aggregation.ts:1)

Why it is not fully complete:
- the engine’s public app-facing API is still located in `detector.ts`, which now contains detector logic, heuristic cards, mapping, and composition together
- the boundary is conceptually clean, but the module ownership is not yet clean
- card ordering is deterministic in array order, but ranking policy is not explicitly defined as part of the engine contract

Focused follow-up if needed:
- extract composer-specific ownership into a dedicated `composer` module only if we decide Phase 2 still needs boundary cleanup
- document output ordering guarantees and suppression rules as explicit engine contract behavior

### 2. Detector Coverage

Status: `partially complete`

What is working:
- structured subscription detection exists in [detector.ts](/abs/path/D:/Documents/StartUp/spend-lense/src/features/insights-engine/detector.ts:371)
- structured unusual-spend detection exists in [detector.ts](/abs/path/D:/Documents/StartUp/spend-lense/src/features/insights-engine/detector.ts:456)
- both structured outputs have deterministic tests in [detector.test.ts](/abs/path/D:/Documents/StartUp/spend-lense/src/features/insights-engine/__tests__/detector.test.ts:1)
- duplicate filtering is reused before structured detection

What is still blurry:
- legacy heuristics and structured detectors live side by side in the same file
- only subscription overlap suppression is formalized right now
- other heuristics such as `detectMoneyLeaks`, `detectImpulseSpending`, and `detectWeekendOverspend` are still directly card-producing heuristics rather than structured detector outputs
- `detectSubscriptionBurden(...)` remains a heuristic fallback in [detector.ts](/abs/path/D:/Documents/StartUp/spend-lense/src/features/insights-engine/detector.ts:148), which is valid today but means the engine is still half heuristic and half structured

Audit judgment:
- this is acceptable for current product value
- this should not block Phase 2 exit if the current supported insight set behaves correctly
- converting every heuristic into a structured detector is better treated as future detector expansion, not mandatory cleanup

### 3. Composer Behavior

Status: `needs hardening`

What is working:
- structured subscription candidates are mapped through `mapSubscriptionCandidateToInsight(...)` in [detector.ts](/abs/path/D:/Documents/StartUp/spend-lense/src/features/insights-engine/detector.ts:301)
- structured unusual-spend candidates are mapped through `mapUnusualSpendCandidateToInsight(...)` in [detector.ts](/abs/path/D:/Documents/StartUp/spend-lense/src/features/insights-engine/detector.ts:322)
- heuristic subscription burden is suppressed when structured subscription candidates exist in [detector.ts](/abs/path/D:/Documents/StartUp/spend-lense/src/features/insights-engine/detector.ts:355)
- empty input returns a stable empty array in [detector.ts](/abs/path/D:/Documents/StartUp/spend-lense/src/features/insights-engine/detector.ts:347)

What is missing:
- no explicit top-level prioritization model beyond current array concatenation order
- no global duplicate/similarity suppression beyond subscription burden overlap
- no cap on output volume if more detectors are added later
- no formal distinction between `engine result order` and `UI display priority`

Audit judgment:
- the composer is good enough for current insight count
- the composer is the next place where scale complexity will show up first
- future work here should be a focused `ranking and suppression policy` phase, not mixed with UI polish

### 4. UI Dependency And Copy Coupling

Status: `needs hardening`

What is working:
- the screen uses `generateAllInsights(...)` as the single source of insight cards in [insights.tsx](/abs/path/D:/Documents/StartUp/spend-lense/app/(tabs)/insights.tsx:514)
- the overview row already understands `subscription`, `money_leak`, and `unusual_spend` in [insights.tsx](/abs/path/D:/Documents/StartUp/spend-lense/app/(tabs)/insights.tsx:527)
- risk checklist and growth tip logic explicitly recognize structured subscription and unusual-spend cards in [insights.tsx](/abs/path/D:/Documents/StartUp/spend-lense/app/(tabs)/insights.tsx:778) and [insights.tsx](/abs/path/D:/Documents/StartUp/spend-lense/app/(tabs)/insights.tsx:919)

What is still coupled:
- the screen derives multiple presentation sections by manually inspecting `card.type`
- copy and downstream behavior are still implemented in screen logic instead of a shared presentation mapping
- new insight types will require multiple UI edits unless a presentation adapter is introduced

Audit judgment:
- current coupling is manageable for the present insight set
- this is the main productization pressure point for future insight expansion
- if we add more insight types, a separate presentation-mapping layer becomes high priority

## Completion Classification

### Complete

- local-only structured subscription detector
- local-only structured unusual-spend detector
- single app-facing composer entry point
- basic UI integration for the currently supported structured insights
- regression-safe validation path through `npm test` and `npm run test:research all`

### Needs Hardening

- engine module ownership and separation of concerns
- explicit composer ranking and suppression rules
- UI presentation mapping for card types
- stronger contract documentation around output ordering and supported card semantics

### Future Enhancement

- convert additional heuristics into structured detectors
- add new detector families
- add insight ranking/scoring beyond current concatenation order
- add a presentation adapter so the screen stops branching on raw card types everywhere

### Out Of Scope For Phase 2

- parser changes
- dedupe changes
- DB schema changes
- SMS runtime changes
- AI/API-backed insight generation
- full UI redesign

## Documentation Drift

Observed drift:
- architecture docs describe a broad `Analytics Engine` and `services/analytics/` area, but the actual implemented insight system currently lives in `src/features/insights-engine/*`
- actual code should remain the source of truth

Recommendation:
- update architecture-facing docs later so they reflect `src/features/insights-engine` as the current insights implementation area

## Focused Next-Phase Model

Do not keep extending one generic Phase 2 chain.

Use one of these focused tracks for follow-up work:

1. `Engine Hardening`
- scope: module ownership, composer contract, ranking and suppression policy
- only create this if we decide Phase 2 exit still requires internal engine cleanup

2. `Detector Expansion`
- scope: new structured detectors or converting legacy heuristics into structured outputs
- this should be treated as post-Phase-2 capability growth unless a current heuristic causes real product confusion

3. `Presentation Hardening`
- scope: UI presentation mapping, copy consistency, display priority, empty-state behavior
- this is the right track for work that changes `insights.tsx` behavior without changing detection logic

## Recommended Decision For Current Roadmap

Current recommendation:
- keep `012` as the last currently defined Phase 2 prompt
- treat any follow-up after `012` as a new focused track, not as `013 Phase 2H`

Suggested stop rule:
- if `012` satisfies the existing Phase 2 exit criteria in `insights-roadmap.md`, Phase 2 should be closed
- only open a new workstream if the audit findings are converted into a clearly scoped hardening or enhancement track
