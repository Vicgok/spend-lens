# SpendLens Research Test Suite

Unified research-loop test suites for the transaction parser engine and the deduplication engine.
Single source of truth: `research-loop/test-suite/`

## Directory Layout

```
research-loop/test-suite/
|-- parser/
|   |-- corpus/             # Read-only JSON sample files (parser expectations)
|   |-- evaluator.ts        # Parsing accuracy evaluation logic
|   |-- run.ts              # Load corpus -> evaluate -> print metrics -> write normalized latest-metrics.json
|   |-- reports/
|   |   |-- baseline.json       # Accepted accuracy baseline
|   |   |-- latest-metrics.json # Normalized output of last parser run
|   |   |-- failures.json       # Failure details from last failure-report run
|   |   |-- failures.tsv        # Failure details in TSV format
|   |   |-- results.tsv         # Append-only history of KEEP rounds
|   |   `-- parser-spec.md      # Notes on parser expectations
|   `-- scripts/
|       |-- failure-report.ts   # Generates failures.json + failures.tsv
|       `-- parser-loop.ts      # KEEP/REVERT loop for iterative parser improvement
|
|-- dedupe/
|   |-- corpus/             # Read-only JSON sample groups (dedupe expectations)
|   |-- evaluator.ts        # Deduplication metric evaluation (FP/FN, precision, recall)
|   |-- run.ts              # Evaluate dedupe -> determinism audit -> write reports
|   |-- reports/
|   |   |-- baseline.json          # Accepted dedupe metric baseline
|   |   |-- latest-metrics.json    # Normalized output of last dedupe run
|   |   |-- summary.json           # Full metric summary from last run
|   |   |-- failure.json           # Failed sample details
|   |   |-- failure-buckets.json   # Failure bucket sample-id map
|   |   |-- config-validation.json # Outside-window config violation details
|   |   `-- evaluator-audit.json   # Production readiness audit result
|   `-- scripts/
|       |-- production-safety.ts   # Invariant safety tests for dedupeTransactions
|       `-- fix-corpus.ts          # Utility to fix dedupe corpus time alignment
|
|-- reports/
|   `-- latest-metrics.json    # Normalized combined output of `npm run test:research all`
|
|-- shared/
|   |-- types.ts            # Shared TypeScript types
|   |-- fs-utils.ts         # Shared file I/O helpers
|   |-- metrics-utils.ts    # Shared metric helpers
|   `-- report-utils.ts     # Shared normalized report helpers
|
|-- run.ts                  # Root selective runner
`-- README.md               # This file
```

## Commands

### Run Parser Tests
Evaluates parser accuracy and writes a normalized `latest-metrics.json`.
```bash
npm run test:research parser
# or directly:
npx tsx research-loop/test-suite/parser/run.ts
```

### Run Dedupe Tests
Evaluates deduplication precision/recall, runs determinism and readiness audits, and writes a normalized `latest-metrics.json`.
```bash
npm run test:research dedupe
# or directly:
npx tsx research-loop/test-suite/dedupe/run.ts
```

### Run All Research Tests
Runs parser then dedupe in sequence and writes a combined normalized `latest-metrics.json`.
```bash
npm run test:research all
# or:
npm run test:research
```

### Generate Parser Failure Report
Writes `parser/reports/failures.json` and `failures.tsv`.
```bash
npm run failure-report
```

### Run Parser KEEP/REVERT Loop
Compares new parser output against baseline; updates baseline and results.tsv on KEEP.
```bash
npm run parser:loop [optional-note]
```

### Run Dedupe Production Safety Tests
Runs invariant safety assertions on the deduplication engine grouping logic.
```bash
npm run dedupe:safety
```

### Run Engine Unit Tests
Runs the core SMS parser + dedupe unit tests (not research corpus).
```bash
npm test
```

## Normalized latest-metrics.json Contract

Every research test run should emit a machine-readable `latest-metrics.json` with this base shape:

```json
{
  "suite": "parser",
  "status": "PASS",
  "timestamp": "2026-06-21T00:00:00.000Z",
  "metrics": {},
  "failureBuckets": {},
  "artifacts": {}
}
```

### Parser Output

Written to `research-loop/test-suite/parser/reports/latest-metrics.json`

- `suite`: `"parser"`
- `status`: `PASS` when `overallAccuracy >= 97`, else `FAIL`
- `metrics`: parser accuracy metrics
- `failureBuckets`: `{}` unless a future parser bucket report is added
- `artifacts`: relative paths to generated parser report files

### Dedupe Output

Written to `research-loop/test-suite/dedupe/reports/latest-metrics.json`

- `suite`: `"dedupe"`
- `status`: `PASS` when `dedupePrecision = 100`, `dedupeRecall = 100`, and `pairwiseFP = 0`; else `FAIL`
- `metrics`: `summary.json.metrics`
- `failureBuckets`: `summary.json.bucketCounts`
- `artifacts`: relative paths to `summary.json`, `failure.json`, `failure-buckets.json`, `config-validation.json`, and `evaluator-audit.json`

### Combined all Output

Written to `research-loop/test-suite/reports/latest-metrics.json`

```json
{
  "suite": "all",
  "status": "PASS",
  "timestamp": "2026-06-21T00:00:00.000Z",
  "parser": {},
  "dedupe": {},
  "metrics": {
    "parserAccuracy": 97.28,
    "dedupePrecision": 100,
    "dedupeRecall": 100,
    "falseMerge": 0
  },
  "failureBuckets": {
    "parser": {},
    "dedupe": {}
  },
  "artifacts": {}
}
```

- `status`: `PASS` only when both parser and dedupe normalized statuses are `PASS`
- `parser` and `dedupe`: embedded normalized suite artifacts
- `artifacts`: relative paths to parser, dedupe, and combined `latest-metrics.json` files

## Output Rules

- `corpus/` directories are **read-only** - never written by test runs.
- All generated files go to the `reports/` subdirectory of the respective suite.
- The orchestrator should read `latest-metrics.json` artifacts, not console logs.
- `shared/` contains pure utilities with no side effects.
- `research-loop/autoresearch/` and `research-loop/scripts/` have been removed.
  Their content is now owned by `test-suite/parser/reports/` and `test-suite/dedupe/scripts/`.
