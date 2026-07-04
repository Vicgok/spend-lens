# Codebase Readiness Audit

Date: 2026-07-04

Scope:

- `src/features/insights-engine`
- `src/features/sms-parser` (frozen)
- `src/features/categorizer`

Outcome:

- `insights-engine`: Not production-ready yet
- `sms-parser`: Not safe to freeze as production-ready yet
- `categorizer`: Not production-ready

## Executive Summary

The codebase has a usable foundation, but only the parser has meaningful automated coverage today. Even there, one high-severity dedupe defect remains in the comparator path, which means the SMS pipeline should not be considered safely frozen for production. The insights engine has improved its deterministic snapshot layer, but it still mixes presentation content into the aggregate layer and has shallow test coverage. The categorizer is the least production-ready subsystem: it is a single substring scorer with no dedicated tests, no confidence surface, and several generic keywords that are likely to cause avoidable misclassification.

## Findings

### 1. High: `sms-parser` can mark unrelated transactions as duplicates when the same account is used within 5 minutes

File:
[engine.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/sms-parser/engine.ts:377)

Why it matters:

The comment says the final comparator step should require same account, same amount, same merchant, and close time. The implementation only checks same account after the earlier guards pass.

Evidence:

- Time window guard exists at [engine.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/sms-parser/engine.ts:312)
- Different reference numbers are rejected at [engine.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/sms-parser/engine.ts:326)
- Final duplicate decision returns `true` for any same-account pair at [engine.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/sms-parser/engine.ts:377)

Risk:

Two legitimate transactions on the same account within five minutes can collapse into one dedupe group if they lack conflicting reference numbers.

### 2. High: `categorizer` has no dedicated automated tests and relies on naive substring scoring

Files:

- [categorizer.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/categorizer/categorizer.ts:9)
- [categories.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/categorizer/categories.ts:32)
- [categories.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/categorizer/categories.ts:163)
- [categories.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/categorizer/categories.ts:176)

Why it matters:

The categorizer scores categories by `searchText.includes(keyword)` and sums keyword lengths. There are no boundary checks, merchant normalization layers, tie-break rules, or confidence outputs. Generic keywords such as `store`, `market`, `credit`, and `upi` make false positives likely.

Risk:

- `market` or `store` can incorrectly bias grocery categorization
- `credit` can incorrectly bias income categorization
- `upi` can over-capture transfers even when a stronger merchant-specific expense signal exists

Coverage gap:

There is no categorizer test module under `src/features/categorizer/`; the directory contains only [categories.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/categorizer/categories.ts:1) and [categorizer.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/categorizer/categorizer.ts:1)

### 3. Medium: `insights-engine` mixes UI copy and presentation semantics into the aggregate layer

File:
[aggregates.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/insights-engine/aggregates.ts:344)

Why it matters:

The aggregate layer now emits narrative strings like habit titles, details, risk descriptions, and coach tips directly from the engine. This makes the data layer less reusable, harder to localize, and more brittle to copy changes.

Examples:

- Habit summaries/details at [aggregates.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/insights-engine/aggregates.ts:349)
- Risk description at [aggregates.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/insights-engine/aggregates.ts:436)
- Coach tip generation at [aggregates.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/insights-engine/aggregates.ts:513)

Risk:

Changing product copy or adding localization now requires touching the engine contract instead of a presentation mapper.

### 4. Medium: `insights-engine` uses UTC date truncation in places that can skew local-day behavior

Files:

- [aggregates.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/insights-engine/aggregates.ts:54)
- [aggregates.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/insights-engine/aggregates.ts:464)

Why it matters:

The engine builds local day/week/month windows, but some day keys are derived with `toISOString().split('T')[0]`, which uses UTC. Around midnight or across time zones, this can create mismatches between bucket assignment and displayed day labels.

Risk:

Daily trend labels and weekday/weekend observations can drift from the user’s actual local transaction day.

### 5. Medium: `insights-engine` test coverage is too shallow for production confidence

File:
[run-tests.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/insights-engine/__tests__/run-tests.ts:38)

Why it matters:

There is only one compact synthetic fixture set. It verifies that the happy path works, but it does not stress:

- time zone boundaries
- empty-history behavior for new snapshot section fields
- category tie behavior
- false-positive subscription candidates
- unusual-spend threshold edges

Risk:

The engine can look “green” while still failing on realistic ledger variation.

### 6. Medium: `sms-parser` production-safety tests do not cover the same-account false-positive path

Files:

- [test-production-safety.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/sms-parser/__tests__/test-production-safety.ts:57)
- [test-production-safety.ts](/abs/path/D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/sms-parser/__tests__/test-production-safety.ts:129)

Why it matters:

The existing production-safety suite checks determinism and several bridge/non-bridge scenarios, but it does not include two different same-account transactions within the five-minute window with different merchants or amounts and no references.

Risk:

The suite passes while the real false-positive dedupe bug remains undetected.

## Validation Evidence

Commands run:

- `npm test`
- `npm run test:insights`
- `.\node_modules\.bin\tsx.cmd src\features\sms-parser\__tests__\test-production-safety.ts`

Observed results:

- SMS parser suite passed with 66 assertions
- Insights engine suite passed
- SMS parser production-safety suite passed
- No categorizer test suite exists

## Readiness Assessment

### Insights Engine

Status: `Not ready`

Why:

- Deterministic foundations exist
- Snapshot/store integration exists
- But presentation coupling and shallow coverage still make it too fragile for production claims

What would move it to ready:

- Split narrative copy from numeric/event aggregates
- Add targeted edge-case coverage for time, thresholds, and sparse history
- Add explicit contract tests for `sections.*`

### SMS Parser

Status: `Not ready to freeze`

Why:

- Overall coverage is the strongest of the three systems
- But the same-account dedupe false-positive is a production blocker

What would move it to ready:

- Fix the comparator logic
- Add regression tests for same-account/non-duplicate pairs
- Re-run the full parser and production-safety suites

### Categorizer

Status: `Not ready`

Why:

- No dedicated tests
- No confidence output
- Simple substring scoring is too weak for production classification quality

What would move it to ready:

- Add normalization and token/boundary-aware matching
- Add fixture-driven categorization tests
- Add confidence/explanation output so corrections are auditable

## Phased Fix Plan

### Phase 0: Immediate blocker

Target:

- `sms-parser`

Work:

- Fix `areTransactionsDuplicate` so same-account duplicates also require amount, merchant, and type alignment
- Add regression tests for:
  - same account, different merchant, same 5-minute window
  - same account, different amount, same 5-minute window
  - same account, same merchant, different amount

Exit criteria:

- parser test suite passes
- production-safety suite passes
- new regression suite catches the old bug

### Phase 1: Categorizer hardening

Target:

- `categorizer`

Work:

- Replace raw substring scoring with normalized token matching plus phrase priority
- Reduce or remove generic keywords that cause broad collisions
- Add confidence score and matched-keyword explanation
- Add dedicated test fixtures covering ambiguous merchants and UPI/credit/store overlap

Exit criteria:

- dedicated categorizer suite exists
- ambiguous fixtures behave deterministically
- correction path can audit why a category was chosen

### Phase 2: Insights contract cleanup

Target:

- `insights-engine`

Work:

- Split raw aggregate outputs from presentation copy
- Move titles/descriptions/tips into a mapper or screen adapter layer
- Replace UTC date-key generation with explicit local-day helpers
- Expand tests to include edge thresholds, sparse data, and timezone-adjacent cases

Exit criteria:

- engine exports UI-agnostic primitives
- section-mapper layer has focused tests
- local-day logic is deterministic and documented

### Phase 3: Cross-system production gate

Target:

- all three systems

Work:

- Add a release audit checklist covering parser, categorizer, and insights
- Add golden fixtures that travel through parser -> categorizer -> insights
- Define minimum pass criteria before marking a subsystem frozen

Exit criteria:

- one end-to-end fixture pack exists
- freeze status is evidence-based instead of declarative

## Safe Parallel Sub-Agent Execution Order

This is now enabled in the `.ai-team` workflow docs. Recommended safe order:

1. Orchestrator records scope and constraints.
2. Planner defines subsystem boundaries and output format.
3. Parallel read-only auditors inspect independent areas:
   - Auditor A: `insights-engine`
   - Auditor B: `sms-parser`
   - Auditor C: `categorizer`
4. Orchestrator merges findings into one prioritized report.
5. If remediation is approved, return to sequential execution:
   - Coder
   - Tester
   - Auditor
   - Reviewer

Parallelism rules:

- Parallel agents may read independently but must not edit shared files simultaneously.
- Final decisions remain centralized with the Orchestrator and Reviewer.
- Any code-change phase returns to sequential ownership.
