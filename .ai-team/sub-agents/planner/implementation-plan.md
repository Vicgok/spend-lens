# Implementation Plan

## Task

Implement Phase 2 only from the MVP readiness audit: unify the app shell and semantic theme layer around the tactile light design already used across the main tabs.

## Requirements Summary

Phase 2 should address the highest-value design-system inconsistency next: the provider theme, default settings state, and app-shell backgrounds disagree about what the primary light theme is. The fix should make the provider's semantic light palette match the tactile UI already used in production screens and should remove unnecessary shell overrides for the main tabs.

## Impacted Files

- `src/theme/colors.ts`
- `src/stores/settings-store.ts`
- `app/_layout.tsx`
- `.ai-team/orchestrator/*.md`
- `.ai-team/sub-agents/*.md`

## Plan

1. Align `colors.light` with the tactile app surfaces, borders, and text roles already used throughout the tabs.
2. Change the settings-store default and hydration fallback theme mode to `light`.
3. Remove route-level app-shell background overrides for the main tactile tabs so the provider theme is the source of truth.
4. Run `npm run check` and record the result in `.ai-team`.

## Acceptance Criteria

- The semantic light theme matches the tactile design language closely enough for shared shell usage.
- Fresh settings hydration defaults to light mode.
- Main tab route backgrounds come from the provider theme instead of tactile hardcodes.
- The screen compiles cleanly after the Phase 2 changes.

## Risks

- Some screens still use direct `tokens.colors` or local hardcodes, so this phase should stop at provider/app-shell unification instead of attempting a full component migration.
