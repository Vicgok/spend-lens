# Implementation

## Task

Fix the History tab loading skeleton so it stays aligned with the real expense, income, and savings UI when switching tabs.

## Approved Plan Reference

`sub-agents/planner/implementation-plan.md`

## Changes Made

- Added `HistorySkeleton` in `src/components/ui/Skeleton.tsx` to mirror the actual History screen structure:
  a monthly snapshot card,
  a trend card with chart-mode pills and chart bars,
  transaction-row placeholders.
- Exported `HistorySkeleton` from `src/components/ui/index.tsx`.
- Replaced the History screen loading fallback in `app/(tabs)/transactions.tsx` to use `HistorySkeleton` instead of `TransactionSkeleton`.

## Files Updated

- `src/components/ui/Skeleton.tsx`
- `src/components/ui/index.tsx`
- `app/(tabs)/transactions.tsx`

## Notes

- The fix intentionally keeps the skeleton approximate rather than pixel-identical, but it now follows the same card hierarchy and spacing rhythm as the real History UI.
