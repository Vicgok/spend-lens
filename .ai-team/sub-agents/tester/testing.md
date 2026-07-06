# Testing

## Task

Implement the remaining audited fixes for `categorizer` broad keyword collisions and `insights-engine` snapshot edge coverage.

## Acceptance Checks

| Check | Result | Notes |
| --- | --- | --- |
| Categorizer regression suite passes | Passed | `src/features/categorizer/__tests__/run-tests.ts` passed with the new low-signal keyword collision cases and corroborated entertainment case. |
| Insights snapshot suite passes | Passed | `npm run test:insights` passed with the new unusual-spend and subscription edge coverage assertions. |

## Commands Run

- `.\node_modules\.bin\tsx.cmd src\features\categorizer\__tests__\run-tests.ts`
- `npm run test:insights`

## Evidence for Audit

- Low-signal generic one-keyword matches such as `movie` and `bill` now fall back to uncategorized in the categorizer suite.
- Corroborated entertainment evidence still classifies correctly when a strong merchant signal like `Netflix` is present.
- Insights tests now cover unusual-spend threshold boundaries, sparse-history suppression, subscription cadence rejection, and two-occurrence subscription confidence behavior.
- The categorizer standalone `tsx` run required unsandboxed execution because sandboxed `esbuild` spawn returned `EPERM`.

## Result

Passed targeted validation across the remaining categorizer and insights audit items.
