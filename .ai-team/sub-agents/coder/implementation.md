# Implementation

## Task

Implement Phase 2: categorizer production hardening.

## Approved Plan Reference

`sub-agents/planner/implementation-plan.md`

## Changes Made

- Added `normalizeLearnedKeyword` in `src/features/categorizer/categorizer.ts` so corrected merchant text is canonicalized before persistence by stripping common payment boilerplate and reference-like tokens.
- Updated `src/stores/transaction-store.ts` to reuse that canonical normalizer when learning category keywords and when removing keyword conflicts across categories, which keeps user corrections deterministic even when the raw merchant text is noisy.
- Rebuilt `src/features/categorizer/__tests__/run-tests.ts` into a broader production-style fixture bank covering ambiguous merchant and payment phrasing, prior low-signal collision paths, and a learned-keyword correction flow that preserves explainable matched-keyword output.

## Files Updated

- `src/features/categorizer/categorizer.ts`
- `src/stores/transaction-store.ts`
- `src/features/categorizer/__tests__/run-tests.ts`

## Notes

- The change stays scoped to categorizer behavior and correction learning rather than broadening into parser or insights logic.
- Tester needs to record the dedicated categorizer suite and repo typecheck results as the validation evidence for Phase 2.
