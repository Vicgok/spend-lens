# Codebase Readiness Audit

Date: 2026-07-04

Last updated after remediation: 2026-07-07 (Production 1 freeze audit)

Scope:

- `src/features/insights-engine`
- `src/features/sms-parser` (frozen)
- `src/features/categorizer`

Outcome:

- `insights-engine`: Frozen for Production 1 on the validated 2026-07-07 checklist run
- `sms-parser`: Frozen for Production 1 on the validated 2026-07-07 checklist run
- `categorizer`: Frozen for Production 1 on the validated 2026-07-07 checklist run

## Fix Status Summary

| Fix                                             | Subsystem         | Status   | Notes                                                                                                                                    |
| ----------------------------------------------- | ----------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Same-account dedupe false-positive              | `sms-parser`      | Complete | Fixed in code and covered by production-safety regressions.                                                                              |
| Same-account false-positive regression coverage | `sms-parser`      | Complete | Added explicit same-account different-merchant and different-amount tests.                                                               |
| Naive substring-only categorization             | `categorizer`     | Complete | Replaced with token and phrase-aware matching plus explainable confidence and matched-keyword output.                                    |
| Broad keyword collisions                        | `categorizer`     | Complete | Low-signal single-keyword auto-matches now fall back to uncategorized, and targeted collision regressions pass.                          |
| Dedicated categorizer test suite                | `categorizer`     | Complete | Targeted regression suite now exists and passes.                                                                                         |
| UTC day-key truncation                          | `insights-engine` | Complete | Replaced with local-day key handling in the audited paths.                                                                               |
| Insights snapshot edge coverage                 | `insights-engine` | Complete | Coverage now includes threshold boundaries, sparse-history suppression, subscription cadence edges, and mixed-category sparse snapshots. |
| Presentation copy mixed into aggregate layer    | `insights-engine` | Complete | Raw aggregate outputs are now mapped to screen copy through a presenter layer instead of engine prose.                                   |

## Executive Summary

The original audit identified one high-severity parser blocker, one high-severity categorizer weakness, and two medium-severity insights issues. The immediate parser blocker is fixed, the categorizer is materially safer and more explainable than before, and the insights engine closed its audited contract and date-handling gaps. Phase 3 now adds a concrete cross-system production gate: one golden fixture pack exercises parser -> categorizer -> insights together, and a release audit checklist defines the command set that must pass before any subsystem is described as frozen.

## Findings

### 1. Closed: `sms-parser` same-account dedupe false-positive

Status:

- Closed in remediation

Files:

- [engine.ts](D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/sms-parser/engine.ts)
- [test-production-safety.ts](D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/sms-parser/__tests__/test-production-safety.ts)

Original problem:

The comparator could group any same-account transactions inside the five-minute window even when merchant or amount semantics differed.

Remediation:

- Same-account dedupe now also requires aligned amount, transaction type, and normalized merchant.
- Production-safety regressions were added for:
  - same account, different merchant
  - same account, different amount

Validation:

- `npm test`: PASS
- `.\node_modules\.bin\tsx.cmd src\features\sms-parser\__tests__\test-production-safety.ts`: PASS

Residual risk:

- Medium. The parser is much safer now, but freeze-readiness should still be gated by broader end-to-end fixtures, not only unit and production-safety coverage.

### 2. Improved: `categorizer` no longer relies on naive substring scoring and now exposes explainable results

Status:

- Core matching and explainability gap closed in remediation
- Production-hardening follow-up closed on 2026-07-07

Files:

- [categorizer.ts](D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/categorizer/categorizer.ts)
- [categories.ts](D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/categorizer/categories.ts)
- [run-tests.ts](D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/categorizer/__tests__/run-tests.ts)

Original problem:

The categorizer used `searchText.includes(keyword)` scoring with no dedicated tests, no token boundaries, and several broad keywords that invited false positives.

Remediation:

- Replaced substring-heavy matching with normalized phrase and token-aware scoring.
- Reduced broad default collisions by removing generic keywords such as `store`, `market`, `credit`, and `upi`.
- Reduced the weight of weak generic phrases such as `paid to`, `sent to`, and `bank transfer`.
- Added a low-signal keyword guard so one generic match like `movie` or `bill` no longer auto-classifies by itself.
- Added explainable categorization output with confidence and matched-keyword reporting.
- Added a dedicated categorizer regression suite for ambiguous cases.
- Added canonical learned-keyword normalization so corrected merchant text drops common payment boilerplate and reference-like noise before persistence.
- Expanded the categorizer suite into a broader production-style fixture bank covering ambiguous merchant aliases, recharge wording, transfer wording, entertainment collisions, and learned-correction explainability.

Validation:

- `.\node_modules\.bin\tsx.cmd src\features\categorizer\__tests__\run-tests.ts`: PASS

Residual risk:

- Low-to-medium. The categorizer now has broader ambiguous-merchant coverage and a more stable correction-learning path, but full subsystem freeze should still wait for the cross-system golden fixtures tracked in Phase 3.

### 3. Closed: `insights-engine` no longer mixes presentation copy into the aggregate layer

Status:

- Closed in remediation

Files:

- [aggregates.ts](D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/insights-engine/aggregates.ts)
- [presenter.ts](D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/insights-engine/presenter.ts)
- [insights.tsx](<D:/Documents/StartUp/MicroSaaS/spend-lens/app/(tabs)/insights.tsx>)

Original problem:

The aggregate layer emitted narrative strings such as habit titles, details, risk descriptions, and coach tips directly from the engine contract. That kept copy, localization, and product-language changes coupled to data-layer changes.

Remediation:

- Replaced screen-facing prose in `aggregates.ts` with structured section signals.
- Added `presenter.ts` to map those raw signals into UI copy for the insights screen.
- Updated the screen to read presenter output instead of engine-owned narrative strings.
- Updated insights tests so raw engine signals and presenter-mapped copy are validated separately.

Validation:

- `npm run test:insights`: PASS

Residual risk:

- Low. The aggregate contract is now UI-agnostic in the audited section paths; remaining work is mostly broader contract-depth follow-up rather than copy separation.

### 4. Closed: `insights-engine` UTC date truncation could skew local-day behavior

Status:

- Closed in remediation

Files:

- [aggregates.ts](D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/insights-engine/aggregates.ts)
- [run-tests.ts](D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/insights-engine/__tests__/run-tests.ts)

Original problem:

Some day keys used `toISOString().split('T')[0]`, which could drift from the user’s local day near midnight or across time zones.

Remediation:

- Replaced UTC truncation with explicit local-date key generation in the targeted aggregate paths.
- Added test coverage for the local-day observation path.

Validation:

- `npm run test:insights`: PASS

Residual risk:

- Low for the audited paths. Other future time-sensitive features should keep using the same local-day helper pattern.

### 5. Closed for the audited edge set: `insights-engine` test coverage now covers the previously missing targeted snapshot edges

Status:

- Targeted edge-coverage gap closed in remediation
- Broader production-readiness follow-up still open

File:

- [run-tests.ts](D:/Documents/StartUp/MicroSaaS/spend-lens/src/features/insights-engine/__tests__/run-tests.ts)

Remediation:

- Added empty-section behavior coverage.
- Added local-day observation coverage.
- Added unusual-spend threshold boundary coverage.
- Added sparse-history unusual-spend suppression coverage.
- Added subscription cadence false-positive coverage.
- Added mixed-category sparse snapshot coverage.

Remaining gaps:

- presenter-mapped `sections.*` outputs still rely on a smaller contract suite than a production-ready engine would want

Residual risk:

- Low-to-medium. The audited edge cases and presentation-boundary issue are now closed, but the engine would still benefit from broader contract-style coverage for a stronger production-ready claim.

## Validation Evidence

Commands run:

- `npm test`
- `npm run test:insights`
- `.\node_modules\.bin\tsx.cmd src\features\categorizer\__tests__\run-tests.ts`
- `.\node_modules\.bin\tsx.cmd src\features\sms-parser\__tests__\test-production-safety.ts`
- `npm run test:production-gate`
- `npm.cmd run check`

Observed results:

- SMS parser suite passed with 66 assertions
- Insights engine suite passed, including threshold, sparse-history, subscription cadence, and mixed-category edge coverage
- Categorizer regression suite passed with 20 assertions, including explainability, broader ambiguous-merchant/payment phrasing coverage, low-signal collision coverage, and learned-correction normalization coverage
- SMS parser production-safety suite passed
- Cross-system production-gate suite passed, including dedupe collapse, categorizer explainability, and insights subscription/period assertions from one golden fixture pack
- Repo typecheck passed after the categorizer and transaction-store learning changes

Notes:

- The standalone `tsx` runs required unsandboxed execution because sandboxed `esbuild` spawn returned `EPERM`.

Production 1 freeze decision:

- All checklist commands passed on the same validated 2026-07-07 change set.
- The cross-system production-gate fixture pack preserved dedupe, categorizer explainability, and insights subscription/period expectations.
- Under `docs/release-audit-checklist.md`, this is sufficient to mark `sms-parser`, `categorizer`, `insights-engine`, and the cross-system Production 1 release gate as frozen for this release candidate.

## Readiness Assessment

### Insights Engine

Status: `Frozen for Production 1`

Why:

- Deterministic snapshot foundations exist
- Snapshot/store integration exists
- The audited UTC day-key bug is fixed
- The audited edge coverage gaps are now closed
- Presentation copy is now separated from aggregate signals
- But broader contract-style coverage can still improve confidence

Why frozen:

- `npm run test:insights` passed
- `npm run test:production-gate` passed
- `npm run check` passed
- The checklist criteria for Production 1 were satisfied on this change set

What would unfreeze it:

- Any future change that causes the insights suite, production-gate suite, or typecheck to fail
- Any future presenter-surface expansion that lands without re-running the checklist

### SMS Parser

Status: `Frozen for Production 1`

Why:

- The original high-severity dedupe blocker is fixed
- The production-safety suite now covers the previously missing same-account false-positive path
- Core parser coverage remains the strongest of the three subsystems

Why frozen:

- `npm test` passed
- `.\node_modules\.bin\tsx.cmd src\features\sms-parser\__tests__\test-production-safety.ts` passed
- `npm run test:production-gate` passed
- `npm run check` passed
- The checklist criteria for Production 1 were satisfied on this change set

What would unfreeze it:

- Any future change that causes the parser suite, production-safety suite, production-gate suite, or typecheck to fail
- Any future SMS class addition that lands without extending and re-running the checklist-backed fixture coverage

### Categorizer

Status: `Frozen for Production 1`

Why:

- Dedicated tests now exist
- Matching is safer than naive substring scoring
- Confidence and matched-keyword explanation output now exist
- Low-signal one-keyword collisions are blocked
- Correction learning now normalizes noisy merchant text into stable persisted keywords
- The production-style fixture bank now covers broader merchant and payment wording variation

Why frozen:

- `.\node_modules\.bin\tsx.cmd src\features\categorizer\__tests__\run-tests.ts` passed
- `npm run test:production-gate` passed
- `npm run check` passed
- The checklist criteria for Production 1 were satisfied on this change set

What would unfreeze it:

- Any future change that causes the categorizer suite, production-gate suite, or typecheck to fail
- Any future merchant/payment class addition that lands without extending and re-running the fixture pack

## Updated Fix Plan

### Phase 0: Completed fixes

Completed work:

- Fixed the parser same-account dedupe blocker
- Added parser regressions for the false-positive path
- Hardened categorizer matching and added a dedicated test suite
- Fixed insights local-day key generation and expanded targeted tests

Status:

- Complete

### Phase 1: Remaining insights contract hardening

Target:

- `insights-engine`

Work:

- Add focused contract tests for the presenter boundary
- Expand contract-style coverage around `sections.*` outputs
- Validate screen-side fallbacks against presenter output

Exit criteria:

- engine exports UI-agnostic primitives
- presentation copy changes do not require aggregate-layer edits
- presenter boundary is covered by focused contract tests

Status:

- Complete
- Evidence:
  - Presenter now owns screen summary-card and fallback display mapping in `src/features/insights-engine/presenter.ts`
  - Insights screen consumes presenter-owned contract output instead of raw snapshot candidate fallbacks in `app/(tabs)/insights.tsx`
  - Focused presenter-boundary assertions were added in `src/features/insights-engine/__tests__/run-tests.ts`
  - Validation passed on 2026-07-07 via `npm.cmd run test:insights` and `npm.cmd run check`

### Phase 2: Categorizer production hardening

Target:

- `categorizer`

Work:

- Expand fixture coverage across ambiguous merchant and payment phrasing
- Validate correction/auditability flows
- Add cross-system fixtures that preserve explainability expectations

Exit criteria:

- category decisions are explainable
- broader fixtures behave deterministically

Status:

- Complete
- Evidence:
  - `src/features/categorizer/__tests__/run-tests.ts` now exercises a broader production-style fixture bank for ambiguous merchant and payment wording
  - `src/features/categorizer/categorizer.ts` now exports `normalizeLearnedKeyword` to canonicalize corrected merchant text before keyword persistence
  - `src/stores/transaction-store.ts` now applies that shared canonical normalization when learning or removing category keywords from user corrections
  - Validation passed on 2026-07-07 via `.\node_modules\.bin\tsx.cmd src\features\categorizer\__tests__\run-tests.ts` and `npm.cmd run check`

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

Status:

- Complete
- Evidence:
  - `src/features/production-gate/__tests__/run-tests.ts` now provides one golden fixture pack that travels through parser -> dedupe -> categorizer -> insights
  - `docs/release-audit-checklist.md` now defines the required commands and minimum pass criteria before describing a subsystem as frozen
  - `package.json` now exposes `npm run test:production-gate` as the stable release-gate command
  - Validation passed on 2026-07-07 via `npm.cmd run test:production-gate`, `npm.cmd test`, `.\node_modules\.bin\tsx.cmd src\features\sms-parser\__tests__\test-production-safety.ts`, `.\node_modules\.bin\tsx.cmd src\features\categorizer\__tests__\run-tests.ts`, `npm.cmd run test:insights`, and `npm.cmd run check`

## Safe Parallel Sub-Agent Execution Order

This remains enabled in the `.ai-team` workflow docs. Recommended safe order:

1. Orchestrator records scope and constraints.
2. Planner defines subsystem boundaries and output format.
3. Parallel read-only auditors inspect independent areas:
   - Auditor A: `insights-engine`
   - Auditor B: `sms-parser`
   - Auditor C: `categorizer`
4. Orchestrator merges findings into one prioritized result.
5. If remediation is approved, return to sequential execution:
   - Coder
   - Tester
   - Auditor
   - Reviewer

Parallelism rules:

- Parallel agents may read independently but must not edit shared files simultaneously.
- Final decisions remain centralized with the Orchestrator and Reviewer.
- Any code-change phase returns to sequential ownership.
