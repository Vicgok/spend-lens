# Implementation Plan

## Task

Fix the History tab loading skeleton so it stays aligned with the real expense, income, and savings UI when switching tabs.

## Requirements Summary

The History screen should not fall back to a generic row-only loading placeholder when the actual UI contains a snapshot card, a trend card, and then grouped transactions. The loading shape should mirror that hierarchy closely enough to prevent layout jumps during tab switches.

## Impacted Files

- `src/components/ui/Skeleton.tsx`
- `src/components/ui/index.tsx`
- `app/(tabs)/transactions.tsx`
- `.ai-team/orchestrator/*.md`
- `.ai-team/sub-agents/*.md`

## Plan

1. Inspect the History loading path and compare the current skeleton hierarchy against the live History screen structure.
2. Add a dedicated `HistorySkeleton` that mirrors the snapshot card, trend card, and transaction rows.
3. Replace the History screen’s loading fallback to use the new skeleton instead of the generic transaction-only placeholder.
4. Run `npm run check`, then record the result through the `.ai-team` artifacts.

## Acceptance Criteria

- History loading uses a dedicated skeleton aligned to the live screen hierarchy.
- The skeleton remains stable across expense, income, and savings tab switches.
- The screen compiles after the loading-state update.

## Risks

- Overfitting the skeleton too tightly to current spacing could make future History layout changes require matching skeleton adjustments.
