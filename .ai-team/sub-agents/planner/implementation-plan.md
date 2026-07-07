# Implementation Plan

## Task

Implement Phase 2: categorizer production hardening through the `ai-team:implement` workflow, then update the audit and orchestration status artifacts.

## Requirements Summary

Close the remaining categorizer production-readiness gap by broadening fixture coverage around ambiguous merchant and payment phrasing, hardening correction learning so noisy merchant strings normalize into stable keywords, and preserving explainability across those paths.

## Impacted Files

- `src/features/categorizer/categorizer.ts`
- `src/features/categorizer/__tests__/run-tests.ts`
- `src/stores/transaction-store.ts`
- `.autoresearch/audits/2026-07-04-codebase-readiness-audit.md`
- `.ai-team/orchestrator/*.md`
- `.ai-team/sub-agents/*/*.md`

## Plan

1. Keep the code change scoped to the categorizer path and transaction correction learning rather than expanding into unrelated parser or insights work.
2. In the Coder stage, add a canonical learned-keyword normalizer to strip common payment noise from corrected merchant text before keyword persistence, and reuse it in the transaction store learning flow.
3. Expand the categorizer regression suite into a production-style fixture bank covering ambiguous merchant aliases, transfer wording, recharge phrasing, entertainment collisions, and learned-keyword explainability.
4. In Tester, run the dedicated categorizer suite and a repo typecheck to validate both the pure categorizer path and store integration compile cleanly.
5. In Auditor and Reviewer, verify that the new evidence is enough to mark Phase 2 complete without overstating broader cross-system freeze readiness.

## Acceptance Criteria

- Categorizer output remains deterministic and explainable through confidence plus matched-keyword reporting.
- Broader ambiguous phrasing fixtures pass without regressing prior low-signal safeguards.
- Correction learning stores normalized merchant keywords instead of noisy payment boilerplate.
- Audit and orchestration artifacts are updated with evidence-backed status changes.
- Real test execution is recorded for the changed areas.

## Risks

- Medium risk: over-normalizing corrected merchant text could erase meaningful aliases; trimming should target obvious payment boilerplate and reference noise only.
- Medium risk: broader fixtures can expose current keyword taxonomy gaps; the change should prefer deterministic uncategorized fallbacks over aggressive new broad keywords.
