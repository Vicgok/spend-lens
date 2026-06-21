# SpendLens Research Test Suite

Unified research-loop test suites for the transaction parser engine and the deduplication engine.
Single source of truth: `research-loop/test-suite/`

## Directory Layout

```
research-loop/test-suite/
├── parser/
│   ├── corpus/             # Read-only JSON sample files (parser expectations)
│   ├── evaluator.ts        # Parsing accuracy evaluation logic
│   ├── run.ts              # Load corpus → evaluate → print metrics → write latest-metrics.json
│   ├── reports/
│   │   ├── baseline.json       # Accepted accuracy baseline
│   │   ├── latest-metrics.json # Output of last run (overwritten on each run)
│   │   ├── failures.json       # Failure details from last failure-report run
│   │   ├── failures.tsv        # Failure details in TSV format
│   │   ├── results.tsv         # Append-only history of KEEP rounds
│   │   └── parser-spec.md      # Notes on parser expectations
│   └── scripts/
│       ├── failure-report.ts   # Generates failures.json + failures.tsv
│       └── parser-loop.ts      # KEEP/REVERT loop for iterative parser improvement
│
├── dedupe/
│   ├── corpus/             # Read-only JSON sample groups (dedupe expectations)
│   ├── evaluator.ts        # Deduplication metric evaluation (FP/FN, precision, recall)
│   ├── run.ts              # Evaluate dedupe → determinism audit → write reports
│   ├── reports/
│   │   ├── baseline.json         # Accepted dedupe metric baseline
│   │   ├── summary.json          # Full metric summary from last run
│   │   ├── failure.json          # Failed sample details
│   │   ├── failure-buckets.json  # Failure counts by bucket
│   │   ├── config-validation.json # Outside-window config violation details
│   │   └── evaluator-audit.json  # Production readiness audit result
│   └── scripts/
│       ├── production-safety.ts  # Invariant safety tests for dedupeTransactions
│       └── fix-corpus.ts         # Utility to fix dedupe corpus time alignment
│
├── shared/
│   ├── types.ts            # Shared TypeScript types (ParserMetrics, DedupeMetricsSummary)
│   ├── fs-utils.ts         # Shared file I/O helpers (ensureDir, writeJson, readJson)
│   ├── metrics-utils.ts    # Shared metric helpers (calcPercent, calcF1, formatPercent)
│   └── report-utils.ts     # Shared report writing (saveMetricsReport, loadBaseline)
│
├── run.ts                  # Root selective runner
└── README.md               # This file
```

## Commands

### Run Parser Tests
Evaluates parser accuracy and writes `latest-metrics.json`.
```bash
npm run test:research parser
# or directly:
npx tsx research-loop/test-suite/parser/run.ts
```

### Run Dedupe Tests
Evaluates deduplication precision/recall, runs determinism and readiness audits.
```bash
npm run test:research dedupe
# or directly:
npx tsx research-loop/test-suite/dedupe/run.ts
```

### Run All Research Tests
Runs parser then dedupe in sequence.
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

## Output Rules

- `corpus/` directories are **read-only** — never written by test runs.
- All generated files go to the `reports/` subdirectory of the respective suite.
- `shared/` contains pure utilities with no side effects.
- `research-loop/autoresearch/` and `research-loop/scripts/` have been removed.
  Their content is now owned by `test-suite/parser/reports/` and `test-suite/dedupe/scripts/`.
